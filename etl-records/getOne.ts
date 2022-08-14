import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { ddbClient, Config } from "./util";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity, NotFound } from "http-errors";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export const getItemById = async (id: string) => {
  const params = new GetItemCommand({
    TableName: Config.RECORDS_TABLE_NAME,
    Key: { id: { S: id } },
  });
  const data = await ddbClient.send(params);
  if (!data?.Item) {
    throw new NotFound(`Rule not found with ID ${id}`);
  }
  return unmarshall(data.Item);
};

const lambdaHandler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  if (!event?.pathParameters?.id) {
    throw new UnprocessableEntity();
  }

  const item = await getItemById(event.pathParameters.id);
  return {
    statusCode: 200,
    body: JSON.stringify(item),
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
