import { APIGatewayProxyResult } from "aws-lambda";
import { Config, getS3Object } from "./util";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity } from "http-errors";
import { MerchantRule } from "../etl-rules/types";
import { EtlResult } from "./types";
import { getItemById } from "./getOne";
import { updateEtlCore } from "./updateOne";
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
  return new Engine(formattedRules);
};

const rowProcessor = async (row: any, engine: Engine, etlResult: EtlResult) => {
  const { events } = await engine.run(row);
  let validRow = true;
  if (events.length === 0) {
    validRow = false;
  } else {
    events.forEach((event) => {
      if (validRow && event?.params?.consequence === "row-invalid")
        validRow = false;

      const details: { [key: string]: any } = etlResult.details;
      details[event.type] ||= 0;
      details[event.type] += 1;
    });
  }
  validRow ? (etlResult.valid += 1) : (etlResult.invalid += 1);
};

const execStreamWithRules = async (
  body: Stream,
  merchantId: string,
  partnerId: string
) => {
  const rules = await getRulesBy(merchantId, partnerId);
  const engine = setupRuleEngine(rules);
  const streamOutput: EtlResult = await new Promise((resolve, _) => {
    const etlResult: EtlResult = {
      total: 0,
      valid: 0,
      invalid: 0,
      details: {},
    };
    body
      .pipe(csv.parse({ headers: true }))
      .on("data", async (row) => await rowProcessor(row, engine, etlResult))
      .on("end", (rowCount: number) =>
        resolve({ ...etlResult, total: rowCount })
      );
  });
  const etlResult = await Promise.resolve(streamOutput);
  return etlResult;
};

const lambdaHandler = async ({
  pathParameters,
}: {
  pathParameters: any;
}): Promise<APIGatewayProxyResult> => {
  if (!pathParameters?.id) {
    throw new UnprocessableEntity();
  }

  const coreItem = await getItemById(pathParameters.id);
  await updateEtlCore({ ...coreItem, etlStatus: "processing" });
  const s3Object = await getS3Object(coreItem.s3Key);
  const etlResult = await execStreamWithRules(
    s3Object.Body,
    coreItem.merchantId,
    coreItem.partnerId
  );
  await updateEtlCore({
    ...coreItem,
    etlResult: etlResult,
    etlStatus: "success",
  });
  return {
    statusCode: 200,
    body: JSON.stringify(etlResult),
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
