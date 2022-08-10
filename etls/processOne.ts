import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { ddbClient, Config, getS3Object } from "./util";
import { marshall } from "@aws-sdk/util-dynamodb";
import { withDefaultMiddy } from "./middleware";
import { UnprocessableEntity } from "http-errors";
import { Etl } from "./types";
import { getItemById } from "./getOne";
import * as csv from "@fast-csv/parse";
import fetch from "node-fetch";
import { Engine } from "json-rules-engine";
import { Stream } from "stream";

const rulesUrl = `https://${Config.RULES_API_GATEWAY_ID}.execute-api.${Config.REGION}.amazonaws.com/prod`;

const getRulesBy = async (merchantId: string, partnerId: string) => {
  const response = await fetch(`${rulesUrl}/etl-rules`);
  return await response.json();
};

const execStreamWithRules = async (body: Stream) => {
  const rules = await getRulesBy("", "");
  const engine = new Engine([
    {
      conditions: {
        all: [
          {
            fact: "email",
            operator: "equal",
            value: "mitch.flaherty@gmail.com",
          },
          {
            fact: "email",
            operator: "contains",
            value: "contains",
          },
        ],
      },
      event: {
        type: "row-valid",
        params: {},
      },
    },
  ]);

  body
    .pipe(csv.parse({ headers: true }))
    .on("error", (error: any) => console.error(error))
    .on("data", (row: any) => {
      engine.run(row).then(({ events }) => {
        events.map((event) => console.log(`${row.email} is ${event.type}`));
      });
    })
    .on("end", (rowCount: number) => console.log(`Parsed ${rowCount} rows`));
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
  await execStreamWithRules(s3Object.Body);

  return {
    statusCode: 200,
    body: JSON.stringify({ data: {} }),
  };
};

export const handler = withDefaultMiddy(lambdaHandler);
