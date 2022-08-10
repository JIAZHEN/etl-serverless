import { ScanCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import {
  APIGatewayProxyEventQueryStringParameters,
  APIGatewayProxyResult,
} from "aws-lambda";
import { ddbClient, Config, formatItem } from "./util";
import { withDefaultMiddy } from "./middleware";

const lambdaHandler = async ({
  queryStringParameters,
}: {
  queryStringParameters: APIGatewayProxyEventQueryStringParameters;
}): Promise<APIGatewayProxyResult> => {
  let params = null;
  if (queryStringParameters?.merchantId && queryStringParameters?.partnerId) {
    params = new QueryCommand({
      TableName: Config.TABLE_NAME,
      IndexName: Config.MERCHANTID_INDEX,
      FilterExpression: "merchantId=:merchantId AND partnerId=:partnerId",
      ExpressionAttributeValues: {
        ":merchantId": { S: queryStringParameters.merchantId },
        ":partnerId": { S: queryStringParameters.partnerId },
      },
    });
  } else {
    params = new ScanCommand({ TableName: Config.TABLE_NAME });
  }

  const data = await ddbClient.send(params);
  const formattedItems = data?.Items?.map((item) => formatItem(item));
  return {
    statusCode: 200,
    headers: { "X-Total-Count": String(data.Count) },
    body: JSON.stringify(formattedItems || []),
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
