import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { ddbClient, Config } from "./util";
import { marshall } from "@aws-sdk/util-dynamodb";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity } from "http-errors";
import { Etl } from "./types";
import httpJsonBodyParser from "@middy/http-json-body-parser";

const lambdaHandler = async ({
  body,
  pathParameters,
}: {
  body: Etl;
  pathParameters: any;
}): Promise<APIGatewayProxyResult> => {
  if (!pathParameters?.id) {
    throw new UnprocessableEntity();
  }

  const params: any = new UpdateItemCommand({
    TableName: Config.TABLE_NAME,
    Key: { id: { S: pathParameters.id } },
    UpdateExpression: `set merchantId=:merchantId,partnerId=:partnerId,etlResult=:etlResult,updatedAt=:updatedAt,etlStatus=:etlStatus`,
    ExpressionAttributeValues: marshall({
      ":merchantId": body.merchantId,
      ":partnerId": body.partnerId,
      ":etlResult": body.etlResult || {},
      ":etlStatus": body.etlStatus,
      ":updatedAt": new Date().toUTCString(),
    }),
    ReturnValues: "UPDATED_NEW",
  });

  await ddbClient.send(params);
  return {
    statusCode: 200,
    body: "{}",
  };
};

export const handler = withDefaultMiddy(lambdaHandler).use(
  httpJsonBodyParser()
);
