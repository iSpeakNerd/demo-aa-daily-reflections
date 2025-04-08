import { getFormattedReflectionFromDb } from '../utils/discord-reflections.ts';
import { postToDiscordWebhooks } from './discord-webhook.ts';
import { wrapErrorWithContext, ErrorType } from '../utils/errors.ts';

/**
 * Handles the scheduled reflection invocation request from netlify scheduled jobs
 * @param event - The event object from the request
 * @returns The response from the request
 */
export const handler = async (event: any) => {
  await isCron(event); // log scheduled reflection
  try {
    // Get the formatted reflection embed
    const formattedReflection = await getFormattedReflectionFromDb();

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

/** Check if the request is an internal cron job
 */
const isCron = async (event: any) => {
  try {
    if (event.headers['X-NF-Event'] === 'schedule') {
      console.log(
        'Cron job, running scheduled reflection at: ',
        new Date().toISOString()
      );
      return true;
    }
    return false;
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.INTERNAL);
  }
};
