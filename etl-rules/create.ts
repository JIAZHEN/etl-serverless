import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { EtlRule } from "./types";
import { ddbClient, Config } from "./util";
import { v4 as uuidv4 } from "uuid";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { withDefaultMiddy } from "./middleware";

const createNewRule = async (etlRule: EtlRule) => {
  const cmdInput = {
    TableName: Config.RULES_TABLE_NAME,
    Item: marshall(etlRule),
  };
  return await ddbClient.send(new PutItemCommand(cmdInput));
};

const lambdaHandler = async ({
  body,
}: {
  body: EtlRule;
}): Promise<APIGatewayProxyResult> => {
  const timeUtc = new Date().toUTCString();
  const etlRule: EtlRule = {
    ...body,
    createdAt: timeUtc,
    updatedAt: timeUtc,
    id: uuidv4(),
  };
  const data = await createNewRule(etlRule);
  return {
    statusCode: 200,
    body: JSON.stringify({ ...data, item: etlRule }),
  };
};

export const handler = withDefaultMiddy(lambdaHandler).use(
  httpJsonBodyParser()
);
