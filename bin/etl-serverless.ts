#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { EtlServerlessStack } from "../lib/etl-serverless-stack";
import { EtlRecordsStack } from "../lib/elt-records-stack";

const app = new cdk.App();
const etlRulesStack = new EtlServerlessStack(app, "EtlServerlessStack", {});

new EtlRecordsStack(app, "EtlRecordsStack", {
  rulesGateway: etlRulesStack.rulesGateway,
});
