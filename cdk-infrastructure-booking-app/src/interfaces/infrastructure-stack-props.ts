import { StackProps } from "aws-cdk-lib";

export interface InfrastructureStackProps extends StackProps {
  proyectPrefix: string;
  environment: string;
}