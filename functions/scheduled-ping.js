import dotenv from 'dotenv';

//TODO: convert to ts and add standard error handling

dotenv.config();

export const handler = async (event, context) => {
  console.log('15 min health check ping ran at:', new Date().toISOString());

  try {
    const response = await fetch(
      `${process.env.NETLIFY_APP_URL}/.netlify/functions/scheduled-bot`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SCHEDULED_BOT_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('HTTP error status: ' + response.status);
    }

    console.log('Bot pinged successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Bot pinged successfully' }),
    };
  } catch (error) {
    console.error('Error pinging bot:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to ping bot in scheduled-ping.js',
      }),
    };
  }
};
