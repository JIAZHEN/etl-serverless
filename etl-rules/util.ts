import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
export const ddbClient = new DynamoDBClient({});

export const Config = {
  TABLE_NAME: process.env.TABLE_NAME,
  MERCHANTID_INDEX: process.env.MERCHANTID_INDEX,
};
