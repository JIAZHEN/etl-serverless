import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { ddbClient, Config, formatItem } from "./util";
import { withDefaultMiddy } from "./middleware";

const lambdaHandler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const params = new ScanCommand({ TableName: Config.TABLE_NAME });
  const data = await ddbClient.send(params);
  const formattedItems = data?.Items?.map((item) => formatItem(item));
  return {
    statusCode: 200,
    headers: { "X-Total-Count": String(data.Count) },
    body: JSON.stringify(formattedItems || []),
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
