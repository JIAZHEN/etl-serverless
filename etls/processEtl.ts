import { Config, getS3Object, uploadS3File, getTransformedS3Key } from "./util";
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
import fs from "fs";
import { APIGatewayProxyResultV2, SQSEvent } from "aws-lambda";

export const handler = async (event: SQSEvent): Promise<void> => {
  const messages = event.Records.map((record) => {
    return { body: JSON.parse(record.body) };
  });

  console.log("messages 👉", JSON.stringify(messages, null, 2));
};
