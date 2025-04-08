//! Discord utils, formatting for the bot embed posts

import {
  createDiscordEmbed,
  type DiscordEmbed,
} from '../_types/discord.types.ts';
import { Tables } from '_types/db.types.ts';
import { parseApiForDB, db } from '../utils/supabase.ts';
import { formatDate } from './strings.ts';
import { wrapErrorWithContext, ErrorType } from './errors.ts';
import { buildBbMdUrl } from './bb-url.ts';
import { makeDbDateString } from './supabase-helpers.ts';

export { getFormattedReflectionFromDb };

/**
 * Formats the reflection from the database for Discord output
 * @param data Reflection from the database
 * @returns the Discord embed to send to Discord
 */
const formatDbReflectionForDiscord = async (
  data: Tables<'AA_Daily_Reflections'>
): Promise<DiscordEmbed> => {
  try {
    const pageUrlMd = await buildBbMdUrl(
      data.book_name || 'UNKNOWN BOOK',
      data.page_number!.toString() || '01'
    );
    console.warn('book string is: ', pageUrlMd);

    return createDiscordEmbed({
      title: `Daily Reflections | ${await formatDate(data.date_string)}`,
      description: `## ${data.title}`,
      // author: {
      //   name: 'Daily Reflections',
      //   icon_url: 'https://i.imgur.com/bhs6E2n.jpeg',
      // },
      color: 10448383, // tabletop lavendar
      fields: [
        {
          name: 'Quote',
          value: data.quote_text || 'No Quote found',
        },
        {
          name: 'Reflection',
          value: data.reflection || 'No Reflection found',
        },
        {
          name: 'Source',
          // md link, fallback to plaintext if url is undefined
          value:
            pageUrlMd ?
              `${pageUrlMd}`
            : `${data.book_name}, ${data.page_number}`,
        },
      ],
      footer: {
        text: "Daily Reflections, use `/reflections` to get today's daily reflection",
      },
      // timestamp: new Date().toISOString(),
    });
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.INTERNAL);
  }
};

/**
 * Application logic for Daily Reflections bot
 * - Gets Daily Reflection from the database for date, if provided
 * - Formats the reflection for Discord
 * @param date the date string to get Daily Reflection for
 * @returns The formatted Discord embed
 */
const getFormattedReflectionFromDb = async (date?: string) => {
  try {
    //use date if provided, else today
    const reflection =
      date ?
        await db.CRUD.read(makeDbDateString(new Date(date)))
      : await db.CRUD.read(makeDbDateString(new Date()));
    const discordReflection = await formatDbReflectionForDiscord(reflection);
    return discordReflection;
  } catch (err) {
    throw wrapErrorWithContext(err);
  }
};
