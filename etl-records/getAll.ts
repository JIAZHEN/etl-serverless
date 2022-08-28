import { ScanCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import {
  APIGatewayProxyEventQueryStringParameters,
  APIGatewayProxyResult,
} from "aws-lambda";
import { Config } from "./util";
import { ddbClient } from "./dynamodb";
import { withDefaultMiddy } from "./middleware";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const lambdaHandler = async ({
  queryStringParameters,
}: {
  queryStringParameters: APIGatewayProxyEventQueryStringParameters;
}): Promise<APIGatewayProxyResult> => {
  let cmd = null;
  const commonParams = {
    TableName: Config.RECORDS_TABLE_NAME,
    IndexName: Config.MERCHANTID_INDEX,
    KeyConditionExpression: "merchantId=:merchantId",
  };

  if (queryStringParameters?.merchantId && queryStringParameters?.partnerId) {
    cmd = new QueryCommand({
      ...commonParams,
      FilterExpression: "partnerId=:partnerId",
      ExpressionAttributeValues: {
        ":merchantId": { S: queryStringParameters.merchantId },
        ":partnerId": { S: queryStringParameters.partnerId },
      },
    });
  } else if (queryStringParameters?.merchantId) {
    cmd = new QueryCommand({
      ...commonParams,
      ExpressionAttributeValues: {
        ":merchantId": { S: queryStringParameters.merchantId },
      },
    });
  } else {
    cmd = new ScanCommand({ TableName: Config.RECORDS_TABLE_NAME });
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
