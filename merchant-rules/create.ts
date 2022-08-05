import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

const TABLE_NAME = process.env.TABLE_NAME || "";
const ddbClient = new DynamoDBClient({});

interface MerchantRule {
  merchantId: string;
  partnerId: string;
  [key: string]: any;
}

const handleError = (e: unknown) => {
  let msg = "";
  if (typeof e === "string") {
    msg = e;
  } else if (e instanceof Error) {
    msg = e.message;
  }
  return msg;
};

const createNewRule = async (merchantRule: MerchantRule) => {
  const cmdInput = {
    TableName: TABLE_NAME,
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
