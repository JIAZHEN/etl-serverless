import { Config } from "./util";
import { getS3Object, uploadS3File, getTransformedS3Key } from "./s3";
import { MerchantRule } from "../etl-rules/types";
import { EtlResult, Etl } from "./types";
import { updateEtlCore } from "./updateOne";
import { parse } from "@fast-csv/parse";
import { format, CsvFormatterStream, Row } from "@fast-csv/format";
import fetch from "node-fetch";
import { Engine } from "json-rules-engine";
import { Stream } from "stream";
import { URLSearchParams } from "url";
import fs from "fs";
import { SQSEvent } from "aws-lambda";

const getRulesBy = async (merchantId: string, partnerId: string) => {
  const query = new URLSearchParams({ merchantId, partnerId });
  const response = await fetch(`${Config.RULES_API_URL}/etl-rules?${query}`);
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

const execStreamWithRules = async (body: Stream, coreItem: Etl) => {
  const rules = await getRulesBy(coreItem.merchantId, coreItem.partnerId);
  const engine = setupRuleEngine(rules);
  const csvFile = fs.createWriteStream("/tmp/random.csv");
  const stream = format({ headers: true });
  stream.pipe(csvFile);

  const streamOutput: EtlResult = await new Promise((resolve, _) => {
    const etlResult: EtlResult = {
      total: 0,
      valid: 0,
      invalid: 0,
      details: {},
    };

    body
      .pipe(parse({ headers: true }))
      .on(
        "data",
        async (row) => await rowProcessor(row, engine, etlResult, stream)
      )
      .on("end", (rowCount: number) => {
        stream.end();
        return resolve({ ...etlResult, total: rowCount });
      });
  });

  const etlResult = await Promise.resolve(streamOutput);

  await uploadS3File(
    getTransformedS3Key(coreItem.s3Key),
    fs.readFileSync("/tmp/random.csv")
  );
  return etlResult;
};

export const handler = async (event: SQSEvent): Promise<void> => {
  const messages = event.Records.map(async (record) => {
    const coreItem = JSON.parse(record.body);
    const s3Object = await getS3Object(coreItem.s3Key);
    const etlResult = await execStreamWithRules(s3Object.Body, coreItem as Etl);
    await updateEtlCore({
      ...coreItem,
      etlResult: etlResult,
      etlStatus: "success",
    });
    console.log("Successfully processed event", coreItem);
    return coreItem;
  });

  await Promise.all(messages);
};
