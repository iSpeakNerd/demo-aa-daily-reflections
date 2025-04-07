//! Discord utils, formatting for the bot embed posts

import {
  createDiscordEmbed,
  type DiscordEmbed,
} from '../_types/discord.types.ts';
import { parseApiForDB, db } from '../utils/supabase.ts';
import { formatDate } from './strings.ts';
import { wrapErrorWithContext, ErrorType } from './errors.ts';
import { buildBbMdUrl } from './bb-url.ts';
import dotenv from 'dotenv';

export {
  getFormattedReflection,
  fetchDailyReflection,
  exampleApiResponse,
  sendToSupabase,
};

dotenv.config();

export const apiUrl = process.env.EXTERNAL_API;
if (!apiUrl) {
  throw wrapErrorWithContext('API url not loaded', ErrorType.NOT_FOUND);
}

/**
 * Fetches the daily reflection from the public API
 * @params date - the date to fetch reflection of, fallback to today's if not provided
 * @returns The API response
 */
const fetchDailyReflection = async (
  date?: string
): Promise<typeof exampleApiResponse> => {
  try {
    // make url for provided date, fallback to today if none
    const url = date ? getUrlForDate(date) : await getUrlForToday();

    const response = await fetch(url);
    if (!response.ok) {
      throw wrapErrorWithContext(
        new Error('Failed to fetch daily reflection'),
        ErrorType.EXTERNAL_SERVICE
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.NETWORK);
  }
};

/**
 * Constructs the API URL for today's daily reflection
 * @returns The URL for the daily reflection
 */
const getUrlForToday = async (): Promise<string> => {
  try {
    const today = new Date();
    return getUrlForDate(today);
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.INTERNAL);
  }
};

/** Construct external api for given Date,
 * throws if given invalid date
 *
 * @param date - the date (day, month) to create url for
 * @returns - the external api url for that day
 */
const getUrlForDate = (date: Date | string): string => {
  // parse as midnight UTC to avoid timezone issues
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;

  // handle invalid dates
  if (isNaN(d.getTime())) {
    throw wrapErrorWithContext('Invalid date provided', ErrorType.INTERNAL);
  }

  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${apiUrl}/${month}${day}.json`;
};

/** Formats the daily reflection as a discord embed
 * @param data - The JSON response from the public API
 * @returns The response formatted as a discord embed
 */
const formatForDiscord = async (
  data: typeof exampleApiResponse
): Promise<DiscordEmbed> => {
  try {
    const pageUrlMd = await buildBbMdUrl(
      data.Quote.BookName,
      data.Quote.PageNumber
    );
    console.warn('book string is: ', pageUrlMd);

    return createDiscordEmbed({
      title: `Daily Reflections | ${await formatDate(data.Date)}`,
      description: `## ${data.Title}`,
      // author: {
      //   name: 'Daily Reflections',
      //   icon_url: 'https://i.imgur.com/bhs6E2n.jpeg',
      // },
      color: 10448383, // tabletop lavendar
      fields: [
        {
          name: 'Quote',
          value: data.Quote.Text,
        },
        {
          name: 'Reflection',
          value: data.Comment,
        },
        {
          name: 'Source',
          // md link, fallback to plaintext if url is undefined
          value:
            pageUrlMd ?
              `${pageUrlMd}`
            : `${data.Quote.BookName}, ${data.Quote.PageNumber}`,
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
 * Appication logic for the daily reflection bot.
 * - Gets today's daily reflection from the public API
 * - Formats the reflection for Discord
 * - Writes the reflection to the Supabase DB async
 * @returns The formatted discord embed
 */
const getFormattedReflection = async (date?: string): Promise<DiscordEmbed> => {
  try {
    // fetch the daily reflection
    const data = await fetchDailyReflection(date);

    // format the reflection for discord
    const discordEmbed = await formatForDiscord(data);

    // write today's reflection to supabase db async
    await sendToSupabase(data);

    return discordEmbed;
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.INTERNAL);
  }
};

/**
 * Save parsed reflections to the Supabase database.
 * @param reflection
 * @returns - the db row
 */
const sendToSupabase = async (reflection: typeof exampleApiResponse) => {
  try {
    const parsedData = await parseApiForDB(reflection);
    const result = await db.CRUD.create(parsedData);
    return result;
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.NETWORK);
  }
};

// Example API response
const exampleApiResponse = {
  Date: '14 OCTOBER',
  Title: 'A PROGRAM FOR LIVING',
  Quote: {
    Text: 'When we retire at night, we constructively review our day. .\r\n. . On awakening let us think about the twenty-four hours\r\nahead. . . . Before we begin, we ask God to direct our\r\nthinking, especially asking that it be divorced from selfpity,\r\ndishonest or self-seeking motives.',
    BookName: 'ALCOHOLICS ANONYMOUS',
    PageNumber: 'p. 86',
  },
  Comment:
    "I lacked serenity. With more to do than seemed possible, I\r\nfell further behind, no matter how hard I tried. Worries\r\nabout things not done yesterday and fear of tomorrow's\r\ndeadlines denied me the calm I needed to be effective each\r\nday. Before taking Steps Ten and Eleven, I began to read\r\npassages like the one cited above. I tried to focus on God's\r\nwill, not my problems, and to trust that He would manage\r\nmy day. It worked! Slowly, but it worked!",
};
