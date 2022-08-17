import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { getEtlRecordById } from "./dynamodb";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity, NotFound } from "http-errors";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const lambdaHandler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  if (!event?.pathParameters?.id) {
    throw new UnprocessableEntity();
  }

  const etlRecordItem = await getEtlRecordById(event.pathParameters.id);
  if (!etlRecordItem?.Item) {
    throw new NotFound(`Rule not found with ID ${event.pathParameters.id}`);
  }

  const etlRecord = unmarshall(etlRecordItem.Item);
  return {
    statusCode: 200,
    body: JSON.stringify(etlRecord),
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
