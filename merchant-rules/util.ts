import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
export const ddbClient = new DynamoDBClient({});

export const handleError = (e: unknown) => {
  let msg = "";
  if (typeof e === "string") {
    msg = e;
  } else if (e instanceof Error) {
    msg = e.message;
  }
  return msg;
};

export const Config = {
  TABLE_NAME: process.env.TABLE_NAME,
};
