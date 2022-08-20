export const Config = {
  RECORDS_TABLE_NAME: process.env.RECORDS_TABLE_NAME,
  RECORDS_BUCKET_NAME: process.env.RECORDS_BUCKET_NAME,
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
