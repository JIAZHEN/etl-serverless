import { ScanCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import {
  APIGatewayProxyEventQueryStringParameters,
  APIGatewayProxyResult,
} from "aws-lambda";
import { ddbClient, Config } from "./util";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { withDefaultMiddy } from "./middleware";

const lambdaHandler = async ({
  queryStringParameters,
}: {
  queryStringParameters: APIGatewayProxyEventQueryStringParameters;
}): Promise<APIGatewayProxyResult> => {
  let cmd = null;
  if (queryStringParameters?.merchantId || queryStringParameters?.partnerId) {
    cmd = new QueryCommand({
      TableName: Config.RULES_TABLE_NAME,
      IndexName: Config.MERCHANTID_INDEX,
      KeyConditionExpression: "merchantId=:merchantId",
      FilterExpression: "partnerId=:partnerId",
      ExpressionAttributeValues: {
        ":merchantId": { S: queryStringParameters.merchantId || "" },
        ":partnerId": { S: queryStringParameters.partnerId || "" },
      },
    });
  } else {
    cmd = new ScanCommand({ TableName: Config.RULES_TABLE_NAME });
  }

  const data = await ddbClient.send(cmd);
  const formattedItems = data?.Items?.map((item) => unmarshall(item));
  return {
    statusCode: 200,
    headers: { "X-Total-Count": String(data.Count) },
    body: JSON.stringify(formattedItems || []),
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
