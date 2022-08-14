import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { ddbClient, Config } from "./util";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity } from "http-errors";
import { EtlRule } from "./types";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { marshall } from "@aws-sdk/util-dynamodb";

const lambdaHandler = async ({
  body,
  pathParameters,
}: {
  body: EtlRule;
  pathParameters: any;
}): Promise<APIGatewayProxyResult> => {
  if (!pathParameters?.id) {
    throw new UnprocessableEntity();
  }

  const params: any = new UpdateItemCommand({
    TableName: Config.RULES_TABLE_NAME,
    Key: { id: { S: pathParameters.id } },
    UpdateExpression: `set merchantId=:merchantId,partnerId=:partnerId,#mrule=:rulevalue,updatedAt=:updatedAt,event=:event`,
    ExpressionAttributeValues: marshall({
      ":merchantId": body.merchantId,
      ":partnerId": body.partnerId,
      ":rulevalue": body.rule,
      ":event": body.event,
      ":updatedAt": new Date().toUTCString(),
    }),
    ExpressionAttributeNames: {
      "#mrule": "rule",
    },
    ReturnValues: "UPDATED_NEW",
  });

  await ddbClient.send(params);
  return {
    statusCode: 200,
    body: JSON.stringify({ data: { ...body, id: pathParameters.id } }),
  };
};

export const handler = withDefaultMiddy(lambdaHandler).use(
  httpJsonBodyParser()
);
