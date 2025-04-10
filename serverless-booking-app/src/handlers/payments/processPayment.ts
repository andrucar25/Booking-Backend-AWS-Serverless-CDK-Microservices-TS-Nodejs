import { SQSHandler } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoDb = new DynamoDBClient({ region: process.env.MY_AWS_REGION });

export const processPayment: SQSHandler = async (event) => {
  const bookingTable = process.env.BOOKINGS_TABLE_NAME;
  const roomsTable = process.env.ROOMS_TABLE_NAME;

  for (const record of event.Records) {
    try {
      const snsMessage = JSON.parse(record.body)
      const { bookingId, userEmail, amount, roomId } = JSON.parse(snsMessage.Message);
      // Simulating payment
      const paymentSuccess = await fakePaymentProcessing(userEmail, amount);
      
      if (paymentSuccess) {
        //update booking state to confirmed
        await dynamoDb.send(new UpdateItemCommand({
          TableName: bookingTable,
          Key: { bookingId: { S: bookingId } },
          UpdateExpression: 'SET #state = :confirmed',
          ExpressionAttributeNames: { '#state': 'state' },
          ExpressionAttributeValues: { 
            ':confirmed': { S: 'confirmed' }, 
            ':pending': { S: 'pending' } 
          },
          ConditionExpression: '#state = :pending',
          ReturnValues: 'UPDATED_NEW'
        }));

        //update room isAvailable to false
        await dynamoDb.send(new UpdateItemCommand({
          TableName: roomsTable,
          Key: { roomId: { S: roomId } },
          UpdateExpression: 'SET isAvailable = :false',
          ExpressionAttributeValues: {
            ':false': { BOOL: false },
            ':true': { BOOL: true }
          },
          ConditionExpression: 'isAvailable = :true',
          ReturnValues: 'UPDATED_NEW'
        }));


        //then you can notify success payment via email to user
      }

      if(!paymentSuccess){
        //this goes to DLQ
        throw new Error("Payment failed");
      }

    } catch (error) {
        //this goes to DLQ
      throw error; 
    }
  }
};

async function fakePaymentProcessing(userEmail: string, amount: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 3000));

  return true;
}