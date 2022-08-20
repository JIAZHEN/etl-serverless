#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { EtlRulesStack } from "../lib/etl-rules-stack";
import { EtlRecordsStack } from "../lib/elt-records-stack";
import { EtlUiStack } from "../lib/etl-ui-stack";
import { EtlCoreStack } from "../lib/etl-core-stack";

const app = new cdk.App();
const etlRulesStack = new EtlRulesStack(app, "EtlRulesStack", {});

const etlRecordsStack = new EtlRecordsStack(app, "EtlRecordsStack", {
  rulesGateway: etlRulesStack.rulesGateway,
});

new EtlCoreStack(app, "EtlCoreStack", {
  recordsBucket: etlRecordsStack.recordsBucket,
  recordsTable: etlRecordsStack.recordsTable,
  rulesGateway: etlRulesStack.rulesGateway,
  etlToProcessQueue: etlRecordsStack.etlToProcessQueue,
});

new EtlUiStack(app, "EtlUiStack", {});
