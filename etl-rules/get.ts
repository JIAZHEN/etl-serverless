import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
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
    const formattedItems = data?.Items?.map((item) => unmarshall(item)) || [];
    return {
      statusCode: 200,
      body: JSON.stringify({ ...data, Items: formattedItems }),
    };
  } catch (e: unknown) {
    return { statusCode: 500, body: handleError(e) };
  }
};
