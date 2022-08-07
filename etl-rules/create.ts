import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { MerchantRule } from "./types";
import { ddbClient, Config } from "./util";
import { v4 as uuidv4 } from "uuid";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { withDefaultMiddy } from "./middleware";

const createNewRule = async (merchantRule: MerchantRule) => {
  const cmdInput = {
    TableName: Config.TABLE_NAME,
    Item: marshall(merchantRule),
  };
  return await ddbClient.send(new PutItemCommand(cmdInput));
};

const lambdaHandler = async ({
  body,
}: {
  body: MerchantRule;
}): Promise<APIGatewayProxyResult> => {
  const timeUtc = new Date().toUTCString();
  const merchantRule: MerchantRule = {
    ...body,
    createdAt: timeUtc,
    updatedAt: timeUtc,
    uuid: uuidv4(),
  };
  const data = await createNewRule(merchantRule);
  return {
    statusCode: 200,
    body: JSON.stringify({ ...data, item: merchantRule }),
  };
};

export const handler = withDefaultMiddy(lambdaHandler).use(
  httpJsonBodyParser()
);
