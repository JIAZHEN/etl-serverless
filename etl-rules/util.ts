import { AttributeValue, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export const ddbClient = new DynamoDBClient({});

export const Config = {
  TABLE_NAME: process.env.TABLE_NAME,
  MERCHANTID_INDEX: process.env.MERCHANTID_INDEX,
};

export const formatItem = (item: Record<string, AttributeValue>) => {
  const rule = unmarshall(item);
  return { ...rule, id: rule.uuid };
};
