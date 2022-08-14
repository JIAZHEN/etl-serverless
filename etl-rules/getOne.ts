import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { ddbClient, Config } from "./util";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity, NotFound } from "http-errors";

const lambdaHandler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  if (!event?.pathParameters?.id) {
    throw new UnprocessableEntity();
  }

  const params = new GetItemCommand({
    TableName: Config.RULES_TABLE_NAME,
    Key: { id: { S: event.pathParameters.id } },
  });

  const data = await ddbClient.send(params);

  if (!data?.Item) {
    throw new NotFound(`Rule not found with ID ${event.pathParameters.id}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(unmarshall(data.Item)),
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
