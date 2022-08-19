import { APIGatewayProxyResult } from "aws-lambda";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity } from "http-errors";
import { EtlRecord } from "./types";
import { updateEtlRecord } from "./dynamodb";
import httpJsonBodyParser from "@middy/http-json-body-parser";

const lambdaHandler = async ({
  body,
  pathParameters,
}: {
  body: EtlRecord;
  pathParameters: any;
}): Promise<APIGatewayProxyResult> => {
  if (!pathParameters?.id) {
    throw new UnprocessableEntity();
  }

  await updateEtlRecord(body);
  return {
    statusCode: 200,
    body: JSON.stringify({ ...body, id: pathParameters.id }),
  };
};

export const handler = withDefaultMiddy(lambdaHandler).use(
  httpJsonBodyParser()
);
