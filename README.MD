# Mini booking app - Backend

This project implements a secure booking system with JWT authentication and an asynchronous payment processing flow. The system manages room reservations, user data, and emulated payment events through a decoupled architecture.

## 🛠️ Technologies Used

- **Serverless Framework**: For AWS Lambda deployment and infrastructure management:
  - **Lambda**: Serverless compute for business logic
  - **API Gateway**: HTTP endpoints with JWT authorization for some routes

- **CDK**: AWS CDK for resource provisioning Infrastructure as Code
  - **DynamoDB**: NoSQL database for users, rooms, and bookings
  - **SNS/SQS**: Event-driven messaging for payment processing

- Inside the serverless proyect, i create lambda layer to organize utils and dependencies, so the lambdas can use it and its not necesary to install it in the lambda's package.json. Its a way to keep clean and re use code inside the proyect.

### Key Functionalities

- **Users**:
  - Create user profile.

- **Authorizer**:
  - Login endpoint to authenticate user.
  - An authorizer that protects routes. Must send a valid JWT to pass the authorizer.

- **Rooms**:
  - Create room.
  - Get rooms by its type.

- **Bookings**:
  - Save a booking that calculates the amount and publish a message to SNS.

- **Payments**:
  - Listen the SQS events and process the payment (fake process to emulate) and if its ok, then update the booking and the room availability. If fails, then 
    try 2 times and if fails, send the message to a DLQ.

# 🚀 To run the project

1. First create a .env file in cdk-infrastructure-booking-app and guide from .env.template values. Then launch the cdk with `cdk deploy --all`
2. Then create a .env file into serverless-booking-app folder. Guide from .env.template to see which envs values you need.
3. The JWT_SECRET_SSM_PARAM its generated manually in SSM service to keep the JWT SECRET KEY. To do this run:

  `aws ssm put-parameter \
  --name "/${ANY_NAME}/jwt-secret" \
  --value "any value" \
  --type "SecureString" \
  --region ${your region}`
  
4. Launch the serverless with `sls deploy --verbose` and its to try the endpoints.