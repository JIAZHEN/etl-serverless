import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { Config } from "./util";
import { ddbClient } from "./dynamodb";
import { withDefaultMiddy } from "./middleware";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const lambdaHandler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  const params = new ScanCommand({ TableName: Config.RECORDS_TABLE_NAME });
  const data = await ddbClient.send(params);
  const formattedItems = data?.Items?.map((item) => unmarshall(item));
  return {
    statusCode: 200,
    headers: { "X-Total-Count": String(data.Count) },
    body: JSON.stringify(formattedItems || []),
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
