import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as dotenv from 'dotenv';

export class AwscicdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //load the environment .env file
    dotenv.config();

    // Create a table to store some data.
    const table = new dynamodb.Table(this, "VisitorTimeTable", {
      partitionKey: {
        name: "key",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // when user performs any CRUD action
    });

    //setup lambda
    const lambdaFunction = new lambda.Function(this, 'LambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'main.handler',
      environment: {
        VERSION: process.env.VERSION || "0.0",
        TABLE_NAME: table.tableName
      }
    })

    table.grantReadWriteData(lambdaFunction);

    //to make the lambda accessible, create a functionUrl
    //lambda has an in-built function to make that happen
    const functionUrl = lambdaFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ['*']
      }
    })

    //to make the functionUrl throw out
    new cdk.CfnOutput(this, 'Url', {
      value: functionUrl.url
    })
  }
}
