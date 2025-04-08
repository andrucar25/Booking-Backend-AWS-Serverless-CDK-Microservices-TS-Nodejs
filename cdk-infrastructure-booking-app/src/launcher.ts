import * as cdk from 'aws-cdk-lib';
import * as dotenv from "dotenv";
import { UsersInfrastructureStack } from './infrastructure/users-stack';
import { RoomsInfrastructureStack } from './infrastructure/rooms-stack';
import { BookingsInfrastructureStack } from './infrastructure/bookings-stack';

dotenv.config();

const proyectPrefix = process.env.CDK_PROYECT_PREFIX ?? 'api-booking-harcoded';
const environment = process.env.CDK_ENVIRONMENT ?? 'dev-harcoded';
const infraStackProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  proyectPrefix,
  environment
}

const app = new cdk.App();

new UsersInfrastructureStack(app, `${proyectPrefix}-infra-users-${environment}`, {
  ...infraStackProps,
  description: "Rooms Infrastructure in Booking proyect",
});

new RoomsInfrastructureStack(app, `${proyectPrefix}-infra-rooms-${environment}`, {
  ...infraStackProps,
  description: "Rooms Infrastructure in Booking proyect",
});

new BookingsInfrastructureStack(app, `${proyectPrefix}-infra-bookings-${environment}`, {
  ...infraStackProps,
  description: "Bookings Infrastructure in Booking proyect",
});
