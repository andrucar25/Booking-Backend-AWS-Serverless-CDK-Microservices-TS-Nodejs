import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";

import { InfrastructureStackProps } from '../interfaces/infrastructure-stack-props';

export class BookingsInfrastructureStack extends cdk.Stack {
  public readonly bookingsTable: Table;

  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    const { proyectPrefix, environment } = props;
    const tableName = `${proyectPrefix}-bookings-table-${environment}`;

    this.bookingsTable = new Table(
      this,
      `${proyectPrefix}-bookings-db-table-${environment}`,
      {
        partitionKey: {
          name: "bookingId",
          type: AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        tableName,
      }
    );

    this.bookingsTable.addGlobalSecondaryIndex({
      indexName: "EndDateIndex",
      partitionKey: { name: "endDate", type: AttributeType.STRING }
    });

    new cdk.CfnOutput(this, tableName, {
      value: this.bookingsTable.tableName,
      description: "DynamoDB table for bookings",
      exportName: tableName,
    });
  }
}
