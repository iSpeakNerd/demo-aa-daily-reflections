import { getFormattedReflection } from '../utils/discord-reflections.ts';
import dotenv from 'dotenv';

dotenv.config();

export const handler = async (event: any) => {
  // Log the invocation time
  console.log('Scheduled bot function ran at:', new Date().toISOString());

  // Check for auth token
  const authHeader =
    event.headers['Authorization'] || event.headers['authorization'];
  const expectedToken = process.env.SCHEDULED_BOT_TOKEN;

  console.log('auth header present: ', !!authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Invalid authorization header format');
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: 'Unauthorized - invalid authorization header format',
      }),
    };
  }

  // check auth token
  const authToken = authHeader.split('Bearer ')[1];
  if (!authToken || authToken !== expectedToken) {
    console.error('Invalid or missing authorization token');
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized - invalid token' }),
    };
  }

  try {
    // Get the formatted reflection
    const formattedReflection = await getFormattedReflection();

    // Return success response with the reflection
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully fetched reflection',
        reflection: formattedReflection,
      }),
    };
  } catch (error: any) {
    console.error('Error in scheduled bot:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process scheduled bot function',
        details: error.message,
      }),
    };
  }
};
