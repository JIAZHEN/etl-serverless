import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { ddbClient, Config, formatItem } from "./util";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity, NotFound } from "http-errors";

const lambdaHandler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  if (!event?.pathParameters?.id) {
    throw new UnprocessableEntity();
  }

  const params = new GetItemCommand({
    TableName: Config.TABLE_NAME,
    Key: { uuid: { S: event.pathParameters.id } },
  });

  const data = await ddbClient.send(params);

  if (!data?.Item) {
    throw new NotFound(`Rule not found with ID ${event.pathParameters.id}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(formatItem(data.Item)),
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
