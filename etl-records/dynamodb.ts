import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { ddbClient, Config } from "./util";
import { marshall } from "@aws-sdk/util-dynamodb";

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
