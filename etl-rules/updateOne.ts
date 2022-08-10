import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { ddbClient, Config } from "./util";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity } from "http-errors";
import { MerchantRule } from "./types";
import httpJsonBodyParser from "@middy/http-json-body-parser";

const lambdaHandler = async ({
  body,
  pathParameters,
}: {
  body: MerchantRule;
  pathParameters: any;
}): Promise<APIGatewayProxyResult> => {
  if (!pathParameters?.id) {
    throw new UnprocessableEntity();
  }

  const params: any = new UpdateItemCommand({
    TableName: Config.TABLE_NAME,
    Key: { uuid: { S: pathParameters.id } },
    UpdateExpression: `set merchantId=:merchantId,partnerId=:partnerId,rule=:rule,updatedAt=:updatedAt`,
    ExpressionAttributeValues: {
      ":merchantId": { S: body.merchantId },
      ":partnerId": { S: body.partnerId },
      ":rule": { S: body.rule },
      ":updatedAt": { S: new Date().toUTCString() },
    },
    ReturnValues: "UPDATED_NEW",
  });

  await ddbClient.send(params);
  return {
    statusCode: 200,
    body: JSON.stringify({ data: {} }),
  };
};

export const handler = withDefaultMiddy(lambdaHandler).use(
  httpJsonBodyParser()
);
