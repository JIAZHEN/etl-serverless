import { APIGatewayProxyResult } from "aws-lambda";
import { Config, getS3Object, createS3UploadWithStream } from "./util";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity } from "http-errors";
import { MerchantRule } from "../etl-rules/types";
import { EtlResult, Etl } from "./types";
import { getItemById } from "./getOne";
import { updateEtlCore } from "./updateOne";
import { parse } from "@fast-csv/parse";
import { format, CsvFormatterStream, Row } from "@fast-csv/format";
import fetch from "node-fetch";
import { Engine } from "json-rules-engine";
import { Stream } from "stream";
import { URLSearchParams } from "url";
import { createWriteStream } from "fs";

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

const rowProcessor = async (
  row: any,
  engine: Engine,
  etlResult: EtlResult,
  writeStream: CsvFormatterStream<Row, Row>
) => {
  const { events } = await engine.run(row);
  let validRow = true;
  events.forEach((event) => {
    if (validRow && event?.params?.consequence === "row-invalid")
      validRow = false;

    const details: { [key: string]: any } = etlResult.details;
    details[event.type] ||= 0;
    details[event.type] += 1;
  });

  if (validRow && events.length === 0) {
    validRow = false;
  }

  if (validRow) {
    etlResult.valid += 1;
    writeStream.write(row);
  } else {
    etlResult.invalid += 1;
  }
};

const execStreamWithRules = async (
  body: Stream,
  coreItem: Etl,
  writeStream: CsvFormatterStream<Row, Row>
) => {
  const rules = await getRulesBy(coreItem.merchantId, coreItem.partnerId);
  const engine = setupRuleEngine(rules);
  const streamOutput: EtlResult = await new Promise((resolve, _) => {
    const etlResult: EtlResult = {
      total: 0,
      valid: 0,
      invalid: 0,
      details: {},
    };
    const s3Uploader = createS3UploadWithStream(coreItem.s3Key, writeStream);
    body
      .pipe(parse({ headers: true }))
      .on(
        "data",
        async (row) => await rowProcessor(row, engine, etlResult, writeStream)
      )
      .on("end", async (rowCount: number) => {
        await s3Uploader.done();
        resolve({ ...etlResult, total: rowCount });
      });
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

  const csvFile = createWriteStream("random.csv");
  const stream = format({ headers: true });
  stream.pipe(csvFile);

  const etlResult = await execStreamWithRules(
    s3Object.Body,
    coreItem as Etl,
    stream
  );
  stream.end();

  // await uploadS3File(getTransformedS3Key(coreItem.s3Key), stream);
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
