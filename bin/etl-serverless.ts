#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { EtlServerlessStack } from "../lib/etl-serverless-stack";
import { EtlCoreStack } from "../lib/elt-core-stack";

const app = new cdk.App();
const etlRulesStack = new EtlServerlessStack(app, "EtlServerlessStack", {});

new EtlCoreStack(app, "EtlCoreStack", {
  rulesGateway: etlRulesStack.rulesGateway,
});
