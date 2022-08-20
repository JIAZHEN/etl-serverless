import { Stack, StackProps, RemovalPolicy, Duration } from "aws-cdk-lib";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Bucket } from "aws-cdk-lib/aws-s3";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { join } from "path";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { corsHosts } from "../globalConfig";

const lambdaPath = join(__dirname, "../etl-records");

interface EtlRecordsStackProps extends StackProps {
  rulesGateway: RestApi;
}

export class EtlRecordsStack extends Stack {
  public readonly recordsBucket: Bucket;
  public readonly recordsTable: Table;
  public readonly etlToProcessQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: EtlRecordsStackProps) {
    super(scope, id, props);
    const recordsBucket = new Bucket(this, "etl-records", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
    });
    const recordsTable = this.createEtlRecordsTable();
    // SQL with dead letter queue
    const etlQueueName = "etl-to-process-queue";
    const etlToProcessQueue = new sqs.Queue(this, etlQueueName, {
      deadLetterQueue: {
        queue: new sqs.Queue(this, `${etlQueueName}-dlq`, {
          retentionPeriod: Duration.minutes(10),
        }),
        maxReceiveCount: 1,
      },
    });

    const nodeJsFunctionProps = this.createLambdaProps({
      RECORDS_TABLE_NAME: recordsTable.tableName,
      RECORDS_BUCKET_NAME: recordsBucket.bucketName,
      ETL_TO_PROCESS_QUEUE_URL: etlToProcessQueue.queueUrl,
      RULES_API_URL: props?.rulesGateway?.url || "",
      REGION: process.env.CDK_DEFAULT_REGION || "",
    });

    const createLambda = new NodejsFunction(this, "createFunction", {
      entry: `${lambdaPath}/create.ts`,
      ...nodeJsFunctionProps,
    });
    const createS3PresignedUrlLambda = new NodejsFunction(
      this,
      "createS3PresignedUrlFunction",
      {
        entry: `${lambdaPath}/createS3PresignedUrl.ts`,
        ...nodeJsFunctionProps,
      }
    );
    const getAllLambda = new NodejsFunction(this, "getAllFunction", {
      entry: `${lambdaPath}/getAll.ts`,
      ...nodeJsFunctionProps,
    });
    const getOneLambda = new NodejsFunction(this, "getOneFunction", {
      entry: `${lambdaPath}/getOne.ts`,
      ...nodeJsFunctionProps,
    });
    const deleteOneLambda = new NodejsFunction(this, "deleteOneFunction", {
      entry: `${lambdaPath}/deleteOne.ts`,
      ...nodeJsFunctionProps,
    });
    const updateOneLambda = new NodejsFunction(this, "updateOneFunction", {
      entry: `${lambdaPath}/updateOne.ts`,
      ...nodeJsFunctionProps,
    });
    const processOneLambda = new NodejsFunction(this, "processOneFunction", {
      entry: `${lambdaPath}/processOne.ts`,
      ...nodeJsFunctionProps,
    });

    recordsTable.grantReadWriteData(createLambda);
    recordsTable.grantReadData(getAllLambda);
    recordsTable.grantReadData(getOneLambda);
    recordsTable.grantReadWriteData(deleteOneLambda);
    recordsTable.grantReadWriteData(updateOneLambda);
    recordsTable.grantReadWriteData(processOneLambda);
    recordsBucket.grantReadWrite(createLambda);
    recordsBucket.grantReadWrite(deleteOneLambda);
    recordsBucket.grantReadWrite(createS3PresignedUrlLambda);

    // API Gateway + Lambda
    const api = this.createApi();
    const etls = api.root.addResource("etl-records");
    etls.addMethod("POST", new LambdaIntegration(createLambda));
    etls.addMethod("GET", new LambdaIntegration(getAllLambda));
    const presignedUrlEndpoint = etls.addResource("createS3PresignedUrl");
    presignedUrlEndpoint.addMethod(
      "POST",
      new LambdaIntegration(createS3PresignedUrlLambda)
    );

    const etl = etls.addResource("{id}");
    etl.addMethod("GET", new LambdaIntegration(getOneLambda));
    etl.addMethod("DELETE", new LambdaIntegration(deleteOneLambda));
    etl.addMethod("PUT", new LambdaIntegration(updateOneLambda));
    const etlProcess = etl.addResource("process");
    etlProcess.addMethod("POST", new LambdaIntegration(processOneLambda));
    etlToProcessQueue.grantSendMessages(processOneLambda);

    this.recordsBucket = recordsBucket;
    this.recordsTable = recordsTable;
    this.etlToProcessQueue = etlToProcessQueue;
  }

  private createEtlRecordsTable = () => {
    const table = new Table(this, `EtlRecords`, {
      tableName: "EtlRecords",
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
    });
    return table;
  };

  private createApi = () =>
    new RestApi(this, "EtlRecords API", {
      restApiName: "EtlRecords Service",
      defaultCorsPreflightOptions: {
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Total-Count",
        ],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: corsHosts,
      },
      binaryMediaTypes: ["text/csv"],
    });

  private createLambdaProps = (environment: {
    [key: string]: string;
  }): NodejsFunctionProps => ({
    depsLockFilePath: `${lambdaPath}/package-lock.json`,
    environment: environment,
    bundling: { externalModules: ["aws-sdk"] },
    runtime: Runtime.NODEJS_16_X,
  });
}
