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
