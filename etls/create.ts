import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { EtlCreateInput } from "./types";
import { ddbClient, Config, uploadFile, etlStatus } from "./util";
import { v4 as uuidv4 } from "uuid";
import { withDefaultMiddy } from "./middleware";
import httpJsonBodyParser from "@middy/http-json-body-parser";

const create = async (createInput: EtlCreateInput) => {
  const cmdInput = {
    TableName: Config.TABLE_NAME,
    Item: marshall(createInput),
  };
  return await ddbClient.send(new PutItemCommand(cmdInput));
};

const getS3KeyFromInput = (input: EtlCreateInput) => {
  const todayDate = new Date().toISOString().slice(0, 10);
  return `${input.merchantId}/${input.partnerId}/${todayDate}/${input.partnerFile.filename}`;
};

const lambdaHandler = async ({
  body,
}: {
  body: EtlCreateInput;
}): Promise<APIGatewayProxyResult> => {
  const s3Key = getS3KeyFromInput(body);
  await uploadFile(s3Key, body.partnerFile.content);

  delete body.partnerFile; // remove uploaded file
  const timeUtc = new Date().toUTCString();
  const createInput: EtlCreateInput = {
    ...body,
    etlStatus: etlStatus.pending,
    createdAt: timeUtc,
    updatedAt: timeUtc,
    id: uuidv4(),
    s3Key: s3Key,
    etlResult: {},
  };
  const data = await create(createInput);
  return {
    statusCode: 200,
    body: JSON.stringify({ ...data, item: createInput }),
  };
};

export const handler = withDefaultMiddy(lambdaHandler).use(
  httpJsonBodyParser()
);
