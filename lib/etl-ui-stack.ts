import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { join } from "path";

export class EtlUiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const etlUiCodeBucket = new Bucket(this, "EtlUiApp", {
      bucketName: `etl-ui-app`,
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
    });

    new BucketDeployment(this, "deployStaticWebsite", {
      sources: [Source.asset(join(__dirname, "../etl-ui/build"))],
      destinationBucket: etlUiCodeBucket,
    });

    new CfnOutput(this, "bucketWebsiteUrl", {
      value: etlUiCodeBucket.bucketWebsiteUrl,
    });
  }
}
