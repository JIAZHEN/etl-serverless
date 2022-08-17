import { APIGatewayProxyResult } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { Config } from "./util";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity } from "http-errors";
import { getEtlRecordById } from "./getOne";
import { updateEtlRecord } from "./dynamodb";

const sqsClient = new SQSClient({});

const lambdaHandler = async ({
  pathParameters,
}: {
  pathParameters: any;
}): Promise<APIGatewayProxyResult> => {
  if (!pathParameters?.id) {
    throw new UnprocessableEntity();
  }

  const etlRecord = await getEtlRecordById(pathParameters.id);
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
