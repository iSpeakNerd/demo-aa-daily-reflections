/**
 * Move this file to `~/functions` to allow testing with netlify functions
 * https://docs.netlify.com/functions/overview/
 */

import { ErrorType, wrapErrorWithContext } from 'utils/errors.ts';
import { fetchDailyReflection } from '../../utils/discord-reflections.ts';
import { postToDiscordWebhooks } from '../../functions/discord-webhook.ts';
import { getFormattedReflection } from '../../utils/discord-reflections.ts';

/**
 * Test function to fetch daily reflection for a given date
 * @param event - The event object from the request
 * @returns The response from the request
 */
export const handler = async (event: any) => {
  const date = event.queryStringParameters?.date; // Get date from query parameters

  try {
    // Get the formatted reflection embed
    const formattedReflection = await getFormattedReflection(date);

    // Post to Discord using webhook
    const results = await postToDiscordWebhooks(formattedReflection);

    const anySuccess = results.some((result) => result.success);
    if (!anySuccess) {
      throw wrapErrorWithContext(
        new Error(`Failed to post to all webhooks`),
        ErrorType.EXTERNAL_SERVICE
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Daily reflection posted successfully to Discord channels',
        results,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    const wrapped = wrapErrorWithContext(error, ErrorType.INTERNAL);
    console.error('Error posting daily reflection:', wrapped.context);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to post daily reflection to all Discord channels',
        details: wrapped.originalError.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
