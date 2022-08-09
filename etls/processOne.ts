import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { ddbClient, Config, getS3Object } from "./util";
import { marshall } from "@aws-sdk/util-dynamodb";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity } from "http-errors";
import { Etl } from "./types";
import { getItemById } from "./getOne";
import * as csv from "@fast-csv/parse";

const rulesUrl = `https://${Config.RULES_API_GATEWAY_ID}.execute-api.${Config.REGION}.amazonaws.com/prod`;

const lambdaHandler = async ({
  pathParameters,
}: {
  pathParameters: any;
}): Promise<APIGatewayProxyResult> => {
  if (!pathParameters?.id) {
    throw new UnprocessableEntity();
  }

  const id = pathParameters.id;
  const item = await getItemById(id);
  const s3Object = await getS3Object(item.s3Key);

  s3Object.Body.pipe(csv.parse({ headers: true })).on("data", (row: any) => {
    console.log(row);
  });

  return {
    statusCode: 200,
    body: "",
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
