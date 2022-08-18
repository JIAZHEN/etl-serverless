import { Config } from "./util";
import { getS3Object, uploadS3File, getTransformedS3Key } from "./s3";
import { EtlRule } from "../etl-rules/types";
import { EtlResult, EtlRecord } from "./types";
import { updateEtlRecord } from "./dynamodb";
import { parse } from "@fast-csv/parse";
import { format, CsvFormatterStream, Row } from "@fast-csv/format";
import fetch from "node-fetch";
import { Engine, RuleResult, Event } from "json-rules-engine";
import { Stream } from "stream";
import { URLSearchParams } from "url";
import fs from "fs";
import { SQSEvent } from "aws-lambda";

const getRulesBy = async (merchantId: string, partnerId: string) => {
  const query = new URLSearchParams({ merchantId, partnerId });
  const response = await fetch(`${Config.RULES_API_URL}/etl-rules?${query}`);
  return (await response.json()) as EtlRule[];
};

export const tempFileName = "/tmp/random.csv";

const isInvalidEvent = (event: Event, result: RuleResult) =>
  (event?.params?.consequence === "row-invalid" && result.result) ||
  (event?.params?.consequence === "row-valid" && !result.result);

export const setupRuleEngine = (rules: EtlRule[], etlResult: EtlResult) => {
  const formattedRules = rules.map((rule) => ({
    event: rule.event,
    conditions: { all: [{ ...rule.rule }] },
  }));
  const engine = new Engine(formattedRules);
  return engine;
};

export const rowProcessor = async (
  row: any,
  engine: Engine,
  etlResult: EtlResult,
  writeStream: CsvFormatterStream<Row, Row>
) => {
  const { results, failureResults } = await engine.run(row);
  let rowResult = true;

  [...results, ...failureResults].forEach((result) => {
    if (!result.event) {
      throw new Error("error!");
    }
    const event: Event = result.event;

    if (isInvalidEvent(event, result)) {
      rowResult = false;
      const errors: { [key: string]: any } = etlResult.errors;
      errors[event?.type || ""] ||= 0;
      errors[event?.type || ""] += 1;
    }
  });

  if (rowResult) {
    etlResult.valid += 1;
    writeStream.write(row);
  } else {
    etlResult.invalid += 1;
  }
};

const execStreamWithRules = async (body: Stream, etlRecord: EtlRecord) => {
  const etlResult: EtlResult = {
    total: 0,
    valid: 0,
    invalid: 0,
    errors: {},
  };
  const rules = await getRulesBy(etlRecord.merchantId, etlRecord.partnerId);
  const engine = setupRuleEngine(rules, etlResult);
  const csvFile = fs.createWriteStream(tempFileName);
  const stream = format({ headers: true });
  stream.pipe(csvFile);

  const streamOutput: EtlResult = await new Promise((resolve, _) => {
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

  await Promise.resolve(streamOutput);
  await uploadS3File(
    getTransformedS3Key(etlRecord.s3Key),
    fs.readFileSync(tempFileName)
  );
  return etlResult;
};

export const handler = async (event: SQSEvent): Promise<void> => {
  const messages = event.Records.map(async (record) => {
    const etlRecord = JSON.parse(record.body);
    const s3Object = await getS3Object(etlRecord.s3Key);
    const etlResult = await execStreamWithRules(
      s3Object.Body,
      etlRecord as EtlRecord
    );
    await updateEtlRecord({
      ...etlRecord,
      etlResult: etlResult,
      etlStatus: "success",
    });
    console.log("Successfully processed event", etlRecord);
    return etlRecord;
  });

  await Promise.all(messages);
};
