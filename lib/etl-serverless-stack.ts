import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { join } from "path";

export class EtlServerlessStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const etlTable = this.createMerchantRulesTable();
    const nodeJsFunctionProps = this.createLambdaProps(etlTable);

    const createOneLambda = new NodejsFunction(this, "createItemFunction", {
      entry: join(__dirname, "merchant-rules", "create.ts"),
      ...nodeJsFunctionProps,
    });

    etlTable.grantReadWriteData(createOneLambda);

    const createOneIntegration = new LambdaIntegration(createOneLambda);

    // Create an API Gateway resource for each of the CRUD operations
    const api = new RestApi(this, "MerchantRules API", {
      restApiName: "MerchantRules Service",
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

    const merchantRules = api.root.addResource("merchant-rules");
    merchantRules.addMethod("POST", createOneIntegration);
  }

  private createLambdaProps = (ddbTable: Table): NodejsFunctionProps => ({
    depsLockFilePath: join(__dirname, "merchant-rules", "package-lock.json"),
    environment: { TABLE_NAME: ddbTable.tableName },
    runtime: Runtime.NODEJS_14_X,
  });

  private createMerchantRulesTable = () =>
    new Table(this, `ETL-Service-MerchantRules`, {
      tableName: "MerchantRules",
      partitionKey: {
        name: "merchantId",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "partnerId",
        type: AttributeType.STRING,
      },
    });
}
