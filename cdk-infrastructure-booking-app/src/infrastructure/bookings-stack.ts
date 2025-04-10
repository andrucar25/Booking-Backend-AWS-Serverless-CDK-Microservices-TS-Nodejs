import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { SubscriptionFilter, Topic } from 'aws-cdk-lib/aws-sns';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';

import { InfrastructureStackProps } from '../interfaces/infrastructure-stack-props';

export class BookingsInfrastructureStack extends cdk.Stack {
  public readonly bookingsTable: Table;
  public readonly bookingsTopic: Topic;
  public readonly paymentsQueue: Queue;
  public readonly paymentsDLQ: Queue;

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

    //SNS for bookings events
    this.bookingsTopic = new Topic(this, 'BookingsTopic', {
      displayName: `${proyectPrefix}-bookings-topic-${environment}`,
      topicName: `${proyectPrefix}-bookings-topic-${environment}`
    });

    //DLQ for errors 
    this.paymentsDLQ = new Queue(this, 'PaymentsDLQ', {
      queueName: `${proyectPrefix}-payments-dlq-${environment}`,
      retentionPeriod: cdk.Duration.days(14),
    });


    //SQS queue to notify payments lambda
    this.paymentsQueue = new Queue(this, 'PaymentsQueue', {
      queueName: `${proyectPrefix}-payments-queue-${environment}`,
      // retentionPeriod: cdk.Duration.days(5),
      visibilityTimeout: cdk.Duration.seconds(30),
      deadLetterQueue: {
        queue: this.paymentsDLQ,
        maxReceiveCount: 2
      }
    });


    //Suscription sns to paymentsQueue
    this.bookingsTopic.addSubscription(new SqsSubscription(this.paymentsQueue, {
      filterPolicy: {
        eventType: SubscriptionFilter.stringFilter({
          allowlist: ['PAYMENT_PROCESSING']
        })
      }
    }));

    //Outputs in console
    new cdk.CfnOutput(this, tableName, {
      value: this.bookingsTable.tableName,
      description: "DynamoDB table for bookings",
      exportName: tableName,
    });

    new cdk.CfnOutput(this, 'BookingsTopicArn', {
      value: this.bookingsTopic.topicArn,
      exportName: `${proyectPrefix}-bookings-topic-${environment}-arn`
    });

    new cdk.CfnOutput(this, 'PaymentsDLQUrl', {
      value: this.paymentsDLQ.queueUrl,
      exportName: `${proyectPrefix}-payments-dlq-${environment}`
    });

    new cdk.CfnOutput(this, 'PaymentsQueueUrl', {
      value: this.paymentsQueue.queueUrl,
      exportName: `${proyectPrefix}-payments-queue-${environment}`
    });

  }
}
