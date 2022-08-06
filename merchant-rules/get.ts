import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { ddbClient, handleError, Config } from "./util";

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  if (!event?.pathParameters?.id) {
    return {
      statusCode: 400,
      body: "invalid request.",
    };
  }

  const params = new GetItemCommand({
    TableName: Config.TABLE_NAME,
    Key: { merchantId: { S: event.pathParameters.id } },
  });

  try {
    const data = await ddbClient.send(params);
    return { statusCode: 200, body: JSON.stringify({ merchantRule: data }) };
  } catch (e: unknown) {
    return { statusCode: 500, body: handleError(e) };
  }
};
