import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

export const ddbClient = new DynamoDBClient({});
export const s3Client = new S3Client({});

export const Config = {
  TABLE_NAME: process.env.TABLE_NAME,
  CORE_BUCKET: process.env.CORE_BUCKET,
  RULES_API_GATEWAY_ID: process.env.RULES_API_GATEWAY_ID,
  REGION: process.env.REGION,
};

export const uploadFile = async (s3Key: string, bodyContent: Buffer) => {
  const params = {
    Bucket: Config.CORE_BUCKET,
    Key: s3Key,
    Body: bodyContent,
  };
  return await s3Client.send(new PutObjectCommand(params));
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