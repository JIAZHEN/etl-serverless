import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { ddbClient, Config } from "./util";
import { marshall } from "@aws-sdk/util-dynamodb";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity } from "http-errors";
import { Etl } from "./types";
import httpJsonBodyParser from "@middy/http-json-body-parser";

export const updateEtlCore = async (body: any) => {
  const params: any = new UpdateItemCommand({
    TableName: Config.TABLE_NAME,
    Key: { id: { S: body.id } },
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
  return body;
};

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

  await updateEtlCore(body);
  return {
    statusCode: 200,
    body: JSON.stringify({ data: {} }),
  };
};

export const handler = withDefaultMiddy(lambdaHandler).use(
  httpJsonBodyParser()
);
