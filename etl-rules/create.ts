import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { MerchantRule } from "./types";
import { ddbClient, handleError, Config } from "./util";
import { v4 as uuidv4 } from "uuid";

const createNewRule = async (merchantRule: MerchantRule) => {
  const cmdInput = {
    TableName: Config.TABLE_NAME,
    Item: marshall(merchantRule),
  };
  return await ddbClient.send(new PutItemCommand(cmdInput));
};

export const handler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: "invalid request, you are missing the parameter body",
    };
  }

  try {
    const timeUtc = new Date().toUTCString();
    const merchantRule: MerchantRule = {
      ...JSON.parse(event.body),
      createdAt: timeUtc,
      updatedAt: timeUtc,
      uuid: uuidv4(),
    };
    const data = await createNewRule(merchantRule);
    return {
      statusCode: 200,
      body: JSON.stringify({ ...data, item: merchantRule }),
    };
  } catch (e: unknown) {
    return { statusCode: 500, body: handleError(e) };
  }
};
