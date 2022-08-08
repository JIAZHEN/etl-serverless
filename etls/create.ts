import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { EtlCreateInput } from "./types";
import { ddbClient, Config } from "./util";
import { v4 as uuidv4 } from "uuid";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import { withDefaultMiddy } from "./middleware";

const create = async (createInput: EtlCreateInput) => {
  const cmdInput = {
    TableName: Config.TABLE_NAME,
    Item: marshall(createInput),
  };
  return await ddbClient.send(new PutItemCommand(cmdInput));
};

const lambdaHandler = async ({
  body,
}: {
  body: EtlCreateInput;
}): Promise<APIGatewayProxyResult> => {
  console.info("Uploaded data is", body);
  console.info(body);
  const timeUtc = new Date().toUTCString();
  const createInput: EtlCreateInput = {
    ...body,
    createdAt: timeUtc,
    updatedAt: timeUtc,
    id: uuidv4(),
  };
  const data = await create(createInput);
  return {
    statusCode: 200,
    body: JSON.stringify({ ...data, item: createInput }),
  };
};

export const handler = withDefaultMiddy(lambdaHandler).use(
  httpJsonBodyParser()
);
