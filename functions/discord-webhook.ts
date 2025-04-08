import { verifyKey } from 'discord-interactions';
import { getFormattedReflectionFromDb } from '../utils/discord-reflections.ts';
import {
  type DiscordEmbed,
  type DiscordCommand,
} from '../_types/discord.types.ts';
import { wrapErrorWithContext, ErrorType } from '../utils/errors.ts';
import dotenv from 'dotenv';

//@ts-expect-error - JS file without types
import { commands } from '../utils/deploy-commands.js';

export { handler, postToDiscordWebhooks };

dotenv.config();

// Define types for different response bodies
type DeferredResponseBody = {
  type: 5;
};

type FollowUpResponseBody =
  | {
      content: string;
      embeds?: DiscordEmbed[];
    }
  | {
      content?: string;
      embeds: DiscordEmbed[];
    };

type ResponseBody = DeferredResponseBody | FollowUpResponseBody;

/**
 * Handles incoming requests from Discord (user interactions)
 * - Verifies the request signature
 * - Parses the body
 * - Sends a deferred response (placeholder)
 * - Processes the command
 * - Sends a follow-up message
 * @param event - The event request from discord
 * @returns - errors or 200 status code object
 */
const handler = async (event: any) => {
  const startTime = Date.now();
  const signature = event.headers['x-signature-ed25519'];
  const timestamp = event.headers['x-signature-timestamp'];
  const isValidRequest = await verifyKey(
    event.body, // Ensure this is the raw body
    signature,
    timestamp,
    process.env.DISCORD_PUBLIC_KEY!
  );

  if (!isValidRequest) {
    console.log('Invalid request signature');
    const wrapped = wrapErrorWithContext(
      new Error('Invalid request signature'),
      ErrorType.AUTHENTICATION
    );
    console.error('Error in handler:', wrapped.context);

    return {
      statusCode: 401,
      body: JSON.stringify({
        error: 'Invalid request signature',
      }),
    };
  }

  // Parse the body after verification
  const message = JSON.parse(event.body);
  // console.log('Parsed Body:', message);

  // Handle verification ping from Discord
  if (message.type === 1) {
    console.log('Verification ping received, responding');

    return {
      statusCode: 200,
      body: JSON.stringify({ type: 1 }),
    };
  }

  // Handle slash commands from users
  if (message.type === 2) {
    console.log('Slash command received:', message.data.name);

    try {
      // Send deferred response
      console.time('sendDeferredResponse');
      await sendResponse(message.id, message.token, { type: 5 }, true);
      console.timeEnd('sendDeferredResponse');

      // Process command
      const content = await processCommand(message.data.name, startTime);

      // Send follow-up message
      await sendResponse(message.application_id, message.token, content);
      return { statusCode: 200, body: '' };
    } catch (error) {
      const wrapped = wrapErrorWithContext(error, ErrorType.EXTERNAL_SERVICE);
      console.error('Error processing command:', wrapped.context);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Internal server error',
        }),
      };
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Unknown request type' }),
  };
};
async function sendResponse(
  id: string,
  token: string,
  body: ResponseBody,
  isInitialResponse: boolean = false
): Promise<void> {
  let url = '';
  if (isInitialResponse) {
    url = `https://discord.com/api/v10/interactions/${id}/${token}/callback`;
  } else {
    url = `https://discord.com/api/v10/webhooks/${process.env.DISCORD_CLIENT_ID}/${token}`;
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw wrapErrorWithContext(
        new Error(
          `Failed to send response: ${response.status} ${responseText}`
        ),
        ErrorType.EXTERNAL_SERVICE
      );
    }
    console.log('Response sent successfully');
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.NETWORK);
  }
}
async function processCommand(
  name: string,
  _startTime: number
): Promise<FollowUpResponseBody> {
  const commandNames = commands.map((command: DiscordCommand) => command.name);

  if (!commandNames.includes(name)) {
    const wrapped = wrapErrorWithContext(
      new Error('Command not registered.'),
      ErrorType.VALIDATION
    );
    console.error('Error in processCommand:', wrapped.context);
    return { content: 'Command not registered.' };
  }

  switch (name) {
    // command registry
    case 'ping':
      const endTime = Date.now();
      const pingTime = endTime - _startTime;
      return { content: `Pong! Bot latency is ${pingTime}ms.` };

    case 'reflections':
      try {
        const formattedReflection = await getFormattedReflectionFromDb();
        if (formattedReflection) {
          return { embeds: [formattedReflection] };
        } else {
          throw wrapErrorWithContext(
            new Error('Failed to fetch daily reflection.'),
            ErrorType.INTERNAL
          );
        }
      } catch (error) {
        const wrapped = wrapErrorWithContext(error, ErrorType.EXTERNAL_SERVICE);
        console.error('Error in processCommand:', wrapped.context);
        return {
          content: 'An error occurred while fetching the daily reflection.',
        };
      }
    default:
      return { content: 'Unknown command.' };
  }
}

/**
 * Gets the webhook URLs from the environment variables
 * @returns The webhook URLs
 */
function getWebhookUrls(): string[] {
  const webhookUrls: string[] = [];

  let i = 1;
  while (true) {
    const url = process.env[`DISCORD_WEBHOOK_URL_${i}`];
    if (!url) break;
    webhookUrls.push(url);
    i++;
  }

  if (webhookUrls.length === 0) {
    throw new Error('No webhook URLs configured');
  }

  return webhookUrls;
}

/**
 * Posts an embed to one or more Discord webhooks
 * @param embed - The Discord embed to post
 * @param webhookUrls - Array of URLs to post to
 * @returns Array of responses from each webhook
 */
async function postToDiscordWebhooks(embed: DiscordEmbed) {
  try {
    const urls = getWebhookUrls();

    const results = await Promise.all(
      urls.map(async (url, index) => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              embeds: [embed],
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw wrapErrorWithContext(
              new Error(
                `Discord webhook failed: ${response.status} ${errorText}`
              ),
              ErrorType.EXTERNAL_SERVICE
            );
          }

          return {
            webhookIndex: index,
            success: true,
            status: response.status,
          };
        } catch (error) {
          const wrapped = wrapErrorWithContext(
            new Error(String(error)),
            ErrorType.EXTERNAL_SERVICE
          );
          console.error();

          return {
            webhookIndex: index,
            success: false,
            error: wrapped.context,
          };
        }
      })
    );

    // Log results
    results.forEach((result) => {
      if (result.success) {
        console.log(`Successfully posted to webhook ${result.webhookIndex}`);
      } else {
        console.error(
          `Failed to post to webhook ${result.webhookIndex}: ${result.error}`
        );
      }
    });

    return results;
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.EXTERNAL_SERVICE);
  }
}
