import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";

import { InfrastructureStackProps } from '../interfaces/infrastructure-stack-props';

export class RoomsInfrastructureStack extends cdk.Stack {
  public readonly roomsTable: Table;

  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    const { proyectPrefix, environment } = props;
    const tableName = `${proyectPrefix}-rooms-table-${environment}`;

    this.roomsTable = new Table(
      this,
      `${proyectPrefix}-rooms-db-table-${environment}`,
      {
        partitionKey: {
          name: "roomId",
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        tableName,
      }
    );

    this.roomsTable.addGlobalSecondaryIndex({
      indexName: "TypeIndex",
      partitionKey: { name: "typeRoom", type: AttributeType.STRING }
    });

    new cdk.CfnOutput(this, tableName, {
      value: this.roomsTable.tableName,
      description: "DynamoDB table for rooms",
      exportName: tableName,
    });
  }
}
