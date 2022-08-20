import { Config } from "./util";
import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({});

export const uploadS3File = async (s3Key: string, bodyContent: Buffer) => {
  const params = {
    Bucket: Config.RECORDS_BUCKET_NAME,
    Key: s3Key,
    Body: bodyContent,
  };
  console.info(`Uploading file ${s3Key}`);
  await s3Client.send(new PutObjectCommand(params));
  console.info(`Uploaded file ${s3Key}`);
};

export const createUploadS3PresignedUrl = async (s3Key: string) => {
  const params = {
    Bucket: Config.RECORDS_BUCKET_NAME,
    Key: s3Key,
  };
  const signedUrl = await getSignedUrl(s3Client, new PutObjectCommand(params), {
    expiresIn: 60 * 10,
  });
  console.info(`Created presigned URL ${signedUrl}`);
  return signedUrl;
};

export const deleteS3Object = async (s3Key: string) => {
  const params = {
    Bucket: Config.RECORDS_BUCKET_NAME,
    Key: s3Key,
  };
  return await s3Client.send(new DeleteObjectCommand(params));
};
