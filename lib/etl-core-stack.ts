import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { RestApi } from "aws-cdk-lib/aws-apigateway";
import { Bucket } from "aws-cdk-lib/aws-s3";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { join } from "path";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

const lambdaPath = join(__dirname, "../etl-core");

interface EtlCoreStackProps extends StackProps {
  recordsBucket: Bucket;
  recordsTable: Table;
  rulesGateway: RestApi;
  etlToProcessQueue: sqs.Queue;
}

export class EtlCoreStack extends Stack {
  constructor(scope: Construct, id: string, props: EtlCoreStackProps) {
    super(scope, id, props);

    const nodeJsFunctionProps = this.createLambdaProps({
      RECORDS_TABLE_NAME: props.recordsTable.tableName,
      RECORDS_BUCKET_NAME: props.recordsBucket.bucketName,
      ETL_TO_PROCESS_QUEUE_URL: props.etlToProcessQueue.queueUrl,
      RULES_API_URL: props.rulesGateway?.url || "",
      REGION: process.env.CDK_DEFAULT_REGION || "",
    });

    const processEtlLambda = new NodejsFunction(this, "processEtlFunction", {
      entry: `${lambdaPath}/processEtl.ts`,
      ...nodeJsFunctionProps,
    });

    props.recordsTable.grantReadWriteData(processEtlLambda);
    props.recordsBucket.grantReadWrite(processEtlLambda);

    // SQS lambda
    processEtlLambda.addEventSource(
      new SqsEventSource(props.etlToProcessQueue, {
        batchSize: 10,
      })
    );
  }

  private createLambdaProps = (environment: {
    [key: string]: string;
  }): NodejsFunctionProps => ({
    depsLockFilePath: `${lambdaPath}/package-lock.json`,
    environment: environment,
    bundling: { externalModules: ["aws-sdk"] },
    runtime: Runtime.NODEJS_16_X,
    timeout: Duration.minutes(15),
  });
}
