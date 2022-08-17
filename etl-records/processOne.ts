import { APIGatewayProxyResult } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { Config } from "./util";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity, NotFound } from "http-errors";
import { getEtlRecordById, updateEtlRecord } from "./dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const sqsClient = new SQSClient({});

const lambdaHandler = async ({
  pathParameters,
}: {
  pathParameters: any;
}): Promise<APIGatewayProxyResult> => {
  if (!pathParameters?.id) {
    throw new UnprocessableEntity();
  }

  const etlRecordItem = await getEtlRecordById(pathParameters.id);
  if (!etlRecordItem?.Item) {
    throw new NotFound(`Rule not found with ID ${pathParameters.id}`);
  }

  const etlRecord = unmarshall(etlRecordItem.Item);

  await updateEtlRecord({ ...etlRecord, etlStatus: "processing" });
  await sqsClient.send(
    new SendMessageCommand({
      MessageBody: JSON.stringify(etlRecord),
      QueueUrl: Config.ETL_TO_PROCESS_QUEUE_URL,
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ data: "Message sent." }),
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
