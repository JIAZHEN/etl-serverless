import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { deleteS3Object } from "./s3";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity, NotFound } from "http-errors";
import { deleteEtlRecord, getEtlRecordById } from "./dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const lambdaHandler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  if (!event?.pathParameters?.id) {
    throw new UnprocessableEntity();
  }

  const id = event.pathParameters.id;
  const etlRecordItem = await getEtlRecordById(id);
  if (!etlRecordItem?.Item) {
    throw new NotFound(`Rule not found with ID ${id}`);
  }
  const etlRecord = unmarshall(etlRecordItem.Item);

  await deleteS3Object(etlRecord.s3Key); // delete the S3 file
  await deleteEtlRecord(id);

  return {
    statusCode: 200,
    body: JSON.stringify({ data: {} }),
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
