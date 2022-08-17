import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  UpdateItemCommand,
  PutItemCommand,
  DeleteItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { Config } from "./util";
import { EtlRecordCreateInput } from "./types";
import { marshall } from "@aws-sdk/util-dynamodb";

export const ddbClient = new DynamoDBClient({});

export const createEtlRecord = async (createInput: EtlRecordCreateInput) => {
  const cmdInput = {
    TableName: Config.RECORDS_TABLE_NAME,
    Item: marshall(createInput),
  };
  return await ddbClient.send(new PutItemCommand(cmdInput));
};

export const updateEtlRecord = async (body: any) => {
  const params: any = new UpdateItemCommand({
    TableName: Config.RECORDS_TABLE_NAME,
    Key: { id: { S: body.id } },
    UpdateExpression: `set merchantId=:merchantId,partnerId=:partnerId,etlResult=:etlResult,updatedAt=:updatedAt,etlStatus=:etlStatus`,
    ExpressionAttributeValues: marshall({
      ":merchantId": body.merchantId,
      ":partnerId": body.partnerId,
      ":etlResult": body.etlResult,
      ":etlStatus": body.etlStatus,
      ":updatedAt": new Date().toUTCString(),
    }),
    ReturnValues: "UPDATED_NEW",
  });

  await ddbClient.send(params);
  return body;
};

export const deleteEtlRecord = async (id: string) => {
  const params = new DeleteItemCommand({
    TableName: Config.RECORDS_TABLE_NAME,
    Key: { id: { S: id } },
  });
  return await ddbClient.send(params);
};

export const getEtlRecordById = async (id: string) => {
  const params = new GetItemCommand({
    TableName: Config.RECORDS_TABLE_NAME,
    Key: { id: { S: id } },
  });
  return await ddbClient.send(params);
};
