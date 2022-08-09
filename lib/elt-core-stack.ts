import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
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

const lambdaPath = join(__dirname, "../etls");

interface EtlCoreStackProps extends StackProps {
  rulesGateway: RestApi;
}

export class EtlCoreStack extends Stack {
  constructor(scope: Construct, id: string, props?: EtlCoreStackProps) {
    super(scope, id, props);
    const coreBucket = new Bucket(this, "etl-core", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
    });
    const coreTable = this.createEtlCoreTable();

    const nodeJsFunctionProps = this.createLambdaProps({
      TABLE_NAME: coreTable.tableName,
      CORE_BUCKET: coreBucket.bucketName,
      RULES_API_GATEWAY_ID: props?.rulesGateway?.restApiId || "",
      REGION: process.env.CDK_DEFAULT_REGION || "",
    });

    const createLambda = new NodejsFunction(this, "createFunction", {
      entry: `${lambdaPath}/create.ts`,
      ...nodeJsFunctionProps,
    });
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

    coreTable.grantReadWriteData(createLambda);
    coreTable.grantReadData(getAllLambda);
    coreTable.grantReadData(getOneLambda);
    coreTable.grantReadWriteData(deleteOneLambda);
    coreTable.grantReadWriteData(updateOneLambda);
    coreTable.grantReadData(processOneLambda);
    coreBucket.grantReadWrite(createLambda);
    coreBucket.grantReadWrite(deleteOneLambda);
    coreBucket.grantRead(processOneLambda);

    const api = this.createApi();
    const etls = api.root.addResource("etls");
    etls.addMethod("POST", new LambdaIntegration(createLambda));
    etls.addMethod("GET", new LambdaIntegration(getAllLambda));
    const etl = etls.addResource("{id}");
    etl.addMethod("GET", new LambdaIntegration(getOneLambda));
    etl.addMethod("DELETE", new LambdaIntegration(deleteOneLambda));
    etl.addMethod("PUT", new LambdaIntegration(updateOneLambda));
    const etlProcess = etl.addResource("process");
    etlProcess.addMethod("POST", new LambdaIntegration(processOneLambda));
  }

  private createEtlCoreTable = () => {
    const table = new Table(this, `ETL-Service-EtlCore`, {
      tableName: "EtlCore",
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
    });
    return table;
  };

  private createApi = () =>
    new RestApi(this, "EtlCore API", {
      restApiName: "EtlCore Service",
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
        allowOrigins: ["http://localhost:3000"],
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