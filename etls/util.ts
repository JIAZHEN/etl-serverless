import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { CsvFormatterStream, Row } from "@fast-csv/format";
import { Upload } from "@aws-sdk/lib-storage";
import path from "path";

export const ddbClient = new DynamoDBClient({});
export const s3Client = new S3Client({});

export const Config = {
  TABLE_NAME: process.env.TABLE_NAME,
  CORE_BUCKET: process.env.CORE_BUCKET,
  RULES_API_GATEWAY_ID: process.env.RULES_API_GATEWAY_ID,
  REGION: process.env.REGION,
};

export const uploadS3File = async (s3Key: string, bodyContent: Buffer) => {
  const params = {
    Bucket: Config.CORE_BUCKET,
    Key: s3Key,
    Body: bodyContent,
  };
  console.info(`Uploading file ${s3Key}`);
  await s3Client.send(new PutObjectCommand(params));
  console.info(`Uploaded file ${s3Key}`);
};

export const getTransformedS3Key = (s3Key: string) => {
  const { dir, name, ext } = path.parse(s3Key);
  return `${dir}/${name}-transformed${ext}`;
};

export const createS3UploadWithStream = (
  originS3Key: string,
  stream: CsvFormatterStream<Row, Row>
) => {
  const formattedS3Key = getTransformedS3Key(originS3Key);
  return new Upload({
    client: s3Client,
    queueSize: 1,
    partSize: 1024 * 1024 * 5,
    leavePartsOnError: false,
    params: {
      Bucket: Config.CORE_BUCKET,
      Key: formattedS3Key,
      Body: stream,
    },
  });
};

export const deleteS3Object = async (s3Key: string) => {
  const params = {
    Bucket: Config.CORE_BUCKET,
    Key: s3Key,
  };
  return await s3Client.send(new DeleteObjectCommand(params));
};

export const getS3Object = async (s3Key: string) => {
  const params = {
    Bucket: Config.CORE_BUCKET,
    Key: s3Key,
  };
  return await s3Client.send(new GetObjectCommand(params));
};

export const etlStatus = {
  pending: "pending",
  processing: "processing",
  failed: "failed",
  success: "success",
};
