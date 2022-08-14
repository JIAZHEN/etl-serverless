import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AttributeType, Table, ProjectionType } from "aws-cdk-lib/aws-dynamodb";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { join } from "path";

const lambdaPath = join(__dirname, "../etl-rules");
const merchantIdIndexName = "merchantIdIndex";

export class EtlRulesStack extends Stack {
  public readonly rulesGateway: RestApi;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const etlRulesTable = this.createEtlRulesTable();
    const nodeJsFunctionProps = this.createLambdaProps(etlRulesTable);

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

    etlRulesTable.grantReadWriteData(createLambda);
    etlRulesTable.grantReadData(getAllLambda);
    etlRulesTable.grantReadData(getOneLambda);
    etlRulesTable.grantReadWriteData(deleteOneLambda);
    etlRulesTable.grantReadWriteData(updateOneLambda);
    const createIntegration = new LambdaIntegration(createLambda);
    const getAllIntegration = new LambdaIntegration(getAllLambda);
    const getOneIntegration = new LambdaIntegration(getOneLambda);
    const deleteOneIntegration = new LambdaIntegration(deleteOneLambda);
    const updateOneIntegration = new LambdaIntegration(updateOneLambda);

    // Create an API Gateway resource for each of the CRUD operations
    const api = this.createApi();
    const etlRules = api.root.addResource("etl-rules");
    etlRules.addMethod("POST", createIntegration);
    etlRules.addMethod("GET", getAllIntegration);
    const etlRule = etlRules.addResource("{id}");
    etlRule.addMethod("GET", getOneIntegration);
    etlRule.addMethod("DELETE", deleteOneIntegration);
    etlRule.addMethod("PUT", updateOneIntegration);
    this.rulesGateway = api;
  }

  private createLambdaProps = (ddbTable: Table): NodejsFunctionProps => ({
    depsLockFilePath: `${lambdaPath}/package-lock.json`,
    environment: {
      RULES_TABLE_NAME: ddbTable.tableName,
      MERCHANTID_INDEX: merchantIdIndexName,
    },
    bundling: { externalModules: ["aws-sdk"] },
    runtime: Runtime.NODEJS_16_X,
  });

  private createEtlRulesTable = () => {
    const table = new Table(this, `EtlRules`, {
      tableName: "EtlRules",
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
    });
    table.addGlobalSecondaryIndex({
      indexName: merchantIdIndexName,
      partitionKey: { name: "merchantId", type: AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1,
      projectionType: ProjectionType.ALL,
    });
    return table;
  };

  private createApi = () =>
    new RestApi(this, "EtlRules API", {
      restApiName: "EtlRules Service",
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
    });
}
