import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";

import { InfrastructureStackProps } from '../interfaces/infrastructure-stack-props';

export class UsersInfrastructureStack extends cdk.Stack {
  public readonly usersTable: Table;

  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    const { proyectPrefix, environment } = props;
    const tableName = `${proyectPrefix}-users-table-${environment}`;

    this.usersTable = new Table(
      this,
      `${proyectPrefix}-users-db-table-${environment}`,
      {
        partitionKey: {
          name: "userId",
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        tableName,
      }
    );

    this.usersTable.addGlobalSecondaryIndex({
      indexName: "EmailIndex",
      partitionKey: { name: "email", type: AttributeType.STRING }
    });

    new cdk.CfnOutput(this, tableName, {
      value: this.usersTable.tableName,
      description: "DynamoDB table for users",
      exportName: tableName,
    });
  }
}
