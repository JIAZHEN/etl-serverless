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

export class EtlServerlessStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const etlTable = this.createEtlRulesTable();
    const nodeJsFunctionProps = this.createLambdaProps(etlTable);

    const createLambda = new NodejsFunction(this, "createFunction", {
      entry: `${lambdaPath}/create.ts`,
      ...nodeJsFunctionProps,
    });
    const getLambda = new NodejsFunction(this, "getFunction", {
      entry: `${lambdaPath}/get.ts`,
      ...nodeJsFunctionProps,
    });

    etlTable.grantReadWriteData(createLambda);
    etlTable.grantReadData(getLambda);

    const createIntegration = new LambdaIntegration(createLambda);
    const getIntegration = new LambdaIntegration(getLambda);

    // Create an API Gateway resource for each of the CRUD operations
    const api = this.createApi();
    const EtlRules = api.root.addResource("etl-rules");
    EtlRules.addMethod("POST", createIntegration);
    EtlRules.addMethod("GET", getIntegration);
  }

  private createLambdaProps = (ddbTable: Table): NodejsFunctionProps => ({
    depsLockFilePath: `${lambdaPath}/package-lock.json`,
    environment: {
      TABLE_NAME: ddbTable.tableName,
      MERCHANTID_INDEX: merchantIdIndexName,
    },
    runtime: Runtime.NODEJS_16_X,
  });

  private createEtlRulesTable = () => {
    const table = new Table(this, `ETL-Service-EtlRules`, {
      tableName: "EtlRules",
      partitionKey: {
        name: "uuid",
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
        ],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["http://localhost:3000"],
      },
    });
}
