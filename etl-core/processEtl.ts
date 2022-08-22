import { Config } from "./util";
import { getS3Object, uploadS3File, getTransformedS3Key } from "./s3";
import { EtlRule } from "../etl-rules/types";
import { EtlResult, EtlRecord } from "./types";
import { updateEtlRecord } from "./dynamodb";
import { parse } from "@fast-csv/parse";
import { format, CsvFormatterStream, Row } from "@fast-csv/format";
import fetch from "node-fetch";
import { Engine, RuleResult, Event } from "json-rules-engine";
import { Readable } from "stream";
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
  (event.type === "row-invalid" && result.result) ||
  (event.type === "row-valid" && !result.result);

export const setupRuleEngine = (rules: EtlRule[]) => {
  const formattedRules = rules.map((rule) => ({
    event: rule.event,
    conditions: { all: [{ ...rule.rule }] },
  }));
  return new Engine(formattedRules);
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
    if (!result.event) throw new Error("error!");
    const event: Event = result.event;
    if (isInvalidEvent(event, result)) {
      rowResult = false;
      const errors: { [key: string]: any } = etlResult.errors;
      errors[event?.params?.name || ""] ||= 0;
      errors[event?.params?.name || ""] += 1;
    }
  });

  if (etlResult.total % 100000 === 0) console.log(etlResult);

  if (rowResult) {
    etlResult.valid += 1;
    writeStream.write(row);
  } else {
    etlResult.invalid += 1;
  }
  etlResult.total += 1;
};

const execStreamWithRules = async (body: Readable, etlRecord: EtlRecord) => {
  const rules = await getRulesBy(etlRecord.merchantId, etlRecord.partnerId);
  console.log("Get the following rules", rules);
  const engine = setupRuleEngine(rules);

  const csvFile = fs.createWriteStream(tempFileName);
  const stream = format({ headers: true });
  stream.pipe(csvFile);
  const etlResult: EtlResult = {
    total: 0,
    valid: 0,
    invalid: 0,
    errors: {},
  };

  const streamOutput = new Promise((resolve, reject) => {
    const parser = parse({
      headers: true,
      trim: true,
    });
    parser
      .on("error", (error) => {
        etlResult.errors["file-parse-error"] = error.message;
        return reject(etlResult);
      })
      .on(
        "data",
        async (row) => await rowProcessor(row, engine, etlResult, stream)
      )
      .on("end", (rowCount: number) => {
        stream.end();
        return resolve(etlResult);
      });
    body.pipe(parser);
  });

  try {
    await streamOutput;
    etlRecord.etlStatus = "success";
  } catch (error) {
    etlRecord.etlStatus = "failed";
  }
  await uploadS3File(
    getTransformedS3Key(etlRecord.s3Key),
    fs.readFileSync(tempFileName)
  );
  return { ...etlRecord, etlResult: etlResult };
};

export const handler = async (event: SQSEvent): Promise<void> => {
  const messages = event.Records.map(async (record) => {
    const etlRecord = JSON.parse(record.body);
    console.log("Start processing ETL record", etlRecord);
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
    console.log("Successfully processed event", etlResult);
    return etlResult;
  });

  await Promise.all(messages);
};
