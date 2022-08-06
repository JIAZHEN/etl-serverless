import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { MerchantRule } from "./types";
import { ddbClient, handleError, Config } from "./util";

const createNewRule = async (merchantRule: MerchantRule) => {
  const cmdInput = {
    TableName: Config.TABLE_NAME,
    Item: {
      merchantId: { S: merchantRule.merchantId },
      partnerId: { S: merchantRule.partnerId },
    },
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
    const merchantRule: MerchantRule = JSON.parse(event.body);
    const data = await createNewRule(merchantRule);
    return { statusCode: 200, body: JSON.stringify({ merchantRule: data }) };
  } catch (e: unknown) {
    return { statusCode: 500, body: handleError(e) };
  }
};
