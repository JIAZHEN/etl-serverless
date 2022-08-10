import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { ddbClient, Config, getS3Object } from "./util";
import { marshall } from "@aws-sdk/util-dynamodb";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity } from "http-errors";
import { MerchantRule } from "../etl-rules/types";
import { getItemById } from "./getOne";
import * as csv from "@fast-csv/parse";
import fetch from "node-fetch";
import { Engine } from "json-rules-engine";
import { Stream } from "stream";
import { URLSearchParams } from "url";

const rulesUrl = `https://${Config.RULES_API_GATEWAY_ID}.execute-api.${Config.REGION}.amazonaws.com/prod`;

const getRulesBy = async (merchantId: string, partnerId: string) => {
  const query = new URLSearchParams({ merchantId, partnerId });
  const response = await fetch(`${rulesUrl}/etl-rules?${query}`);
  return (await response.json()) as MerchantRule[];
};

const setupRuleEngine = (rules: MerchantRule[]) => {
  const formattedRules = rules.map((rule) => ({
    event: rule.event,
    conditions: { all: [{ ...rule.rule }] },
  }));
  console.log(formattedRules);
  return new Engine(formattedRules);
};

const execStreamWithRules = async (
  body: Stream,
  merchantId: string,
  partnerId: string
) => {
  const rules = await getRulesBy(merchantId, partnerId);
  const engine = setupRuleEngine(rules);
  const streamOutput: { data: any[]; total: number } = await new Promise(
    (resolve, _) => {
      const data: any = [];
      body
        .pipe(csv.parse({ headers: true }))
        .on("data", async (row) => {
          const { events } = await engine.run(row);
          data.push(events);
        })
        .on("end", (rowCount: number) =>
          resolve({ data: data, total: rowCount })
        );
    }
  );
  const result = await Promise.all(streamOutput.data);
  console.log(streamOutput.total, result);
};

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
  await execStreamWithRules(s3Object.Body, item.merchantId, item.partnerId);
  return {
    statusCode: 200,
    body: JSON.stringify({ data: {} }),
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
