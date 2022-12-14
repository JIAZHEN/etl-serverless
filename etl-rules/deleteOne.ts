import { DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { ddbClient, Config } from "./util";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity } from "http-errors";

const lambdaHandler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  if (!event?.pathParameters?.id) {
    throw new UnprocessableEntity();
  }

  const params = new DeleteItemCommand({
    TableName: Config.RULES_TABLE_NAME,
    Key: { id: { S: event.pathParameters.id } },
  });
  await ddbClient.send(params);
  return {
    statusCode: 200,
    body: JSON.stringify({ data: { id: event.pathParameters.id } }),
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
