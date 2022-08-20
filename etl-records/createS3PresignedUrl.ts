import { APIGatewayProxyResult } from "aws-lambda";
import { EtlRecordCreateInput } from "./types";
import { withDefaultMiddy } from "./middleware";
import { createUploadS3PresignedUrl } from "./s3";
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
  const presignedUrl = await createUploadS3PresignedUrl(s3Key);

  return {
    statusCode: 200,
    body: JSON.stringify({ presignedUrl }),
  };
};

export const handler = withDefaultMiddy(lambdaHandler).use(
  httpJsonBodyParser()
);
