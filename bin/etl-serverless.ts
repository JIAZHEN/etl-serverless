#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { EtlRulesStack } from "../lib/etl-rules-stack";
import { EtlRecordsStack } from "../lib/elt-records-stack";
import { EtlUiStack } from "../lib/etl-ui-stack";

const app = new cdk.App();
const etlRulesStack = new EtlRulesStack(app, "EtlRulesStack", {});

new EtlRecordsStack(app, "EtlRecordsStack", {
  rulesGateway: etlRulesStack.rulesGateway,
});

new EtlUiStack(app, "EtlUiStack", {});
