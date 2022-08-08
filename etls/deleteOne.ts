import { DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { ddbClient, Config, deleteS3Object } from "./util";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity } from "http-errors";
import { getItemById } from "./getOne";

const deleteDDBItem = async (id: string) => {
  const params = new DeleteItemCommand({
    TableName: Config.TABLE_NAME,
    Key: { uuid: { S: id } },
  });
  return await ddbClient.send(params);
};

const lambdaHandler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  if (!event?.pathParameters?.id) {
    throw new UnprocessableEntity();
  }

  const id = event.pathParameters.id;
  const item = await getItemById(id);
  await deleteS3Object(item.s3Key); // delete the S3 file
  await deleteDDBItem(id);

  return {
    statusCode: 200,
    body: "",
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
