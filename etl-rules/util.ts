import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const ddbClient = new DynamoDBClient({});

export const Config = {
  RULES_TABLE_NAME: process.env.RULES_TABLE_NAME,
  MERCHANTID_INDEX: process.env.MERCHANTID_INDEX,
};
