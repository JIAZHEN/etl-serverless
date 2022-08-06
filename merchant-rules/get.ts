import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { ddbClient, handleError, Config } from "./util";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  if (!event?.queryStringParameters?.merchantId) {
    return {
      statusCode: 400,
      body: "invalid request, missing merchantId.",
    };
  }

  const params = new QueryCommand({
    KeyConditionExpression: "merchantId = :merchantId",
    ExpressionAttributeValues: {
      ":merchantId": { S: event.queryStringParameters.merchantId },
    },
    TableName: Config.TABLE_NAME,
  });

  try {
    const data = await ddbClient.send(params);
    return { statusCode: 200, body: JSON.stringify({ merchantRule: data }) };
  } catch (e: unknown) {
    return { statusCode: 500, body: handleError(e) };
  }
};
