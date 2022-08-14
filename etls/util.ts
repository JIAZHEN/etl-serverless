import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const ddbClient = new DynamoDBClient({});

export const Config = {
  TABLE_NAME: process.env.TABLE_NAME,
  CORE_BUCKET: process.env.CORE_BUCKET,
  RULES_API_URL: process.env.RULES_API_URL,
  REGION: process.env.REGION,
  ETL_TO_PROCESS_QUEUE_URL: process.env.ETL_TO_PROCESS_QUEUE_URL,
};

export const etlStatus = {
  pending: "pending",
  processing: "processing",
  failed: "failed",
  success: "success",
};
