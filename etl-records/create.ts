import { APIGatewayProxyResult } from "aws-lambda";
import { createEtlRecord } from "./dynamodb";
import { EtlRecordCreateInput } from "./types";
import { etlStatus } from "./util";
import { uploadS3File } from "./s3";
import { v4 as uuidv4 } from "uuid";
import { withDefaultMiddy } from "./middleware";
import httpJsonBodyParser from "@middy/http-json-body-parser";

const getS3KeyFromInput = (input: EtlRecordCreateInput) => {
  const todayDate = new Date().toISOString().slice(0, 10);
  return `${input.merchantId}/${input.partnerId}/${todayDate}/${input.partnerFile.filename}`;
};

const lambdaHandler = async ({
  body,
}: {
  body: EtlRecordCreateInput;
}): Promise<APIGatewayProxyResult> => {
  const s3Key = getS3KeyFromInput(body);
  await uploadS3File(s3Key, body.partnerFile.content);

  delete body.partnerFile; // remove uploaded file
  const timeUtc = new Date().toUTCString();
  const createInput: EtlRecordCreateInput = {
    ...body,
    etlStatus: etlStatus.pending,
    createdAt: timeUtc,
    updatedAt: timeUtc,
    id: uuidv4(),
    s3Key: s3Key,
    etlResult: {},
  };
  const data = await createEtlRecord(createInput);
  return {
    statusCode: 200,
    body: JSON.stringify({ ...data, item: createInput }),
  };
};

export const handler = withDefaultMiddy(lambdaHandler).use(
  httpJsonBodyParser()
);
