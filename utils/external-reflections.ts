import { DiscordEmbed, createDiscordEmbed } from '_types/discord.types.ts';
import { wrapErrorWithContext, ErrorType } from './errors.ts';
import { db, parseApiForDB } from './supabase.ts';
import { buildBbMdUrl } from './bb-url.ts';
import { formatDate } from './strings.ts';
import dotenv from 'dotenv';

dotenv.config();
export const apiUrl = process.env.EXTERNAL_API;
if (!apiUrl) {
  throw wrapErrorWithContext('API url not loaded', ErrorType.NOT_FOUND);
}

export { type exampleApiResponse, getFormattedReflection };

const delay = async (ms: number) => {
  try {
    console.log(`delaying ${ms} ms`);
    return new Promise((resolve) => setTimeout(resolve, ms));
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.INTERNAL);
  }
};

/** Pulls all reflections from external API and saves to internal DB
 *
 * @returns array of status for each reflection by date_string
 */
export const recordAllReflections = async (): Promise<Array<Object>> => {
  try {
    let urls: string[] = [];
    let results: { status: string; date: string }[] = [];

    //! chunking to avoid rate limiting
    const chunkSize = 20; // 20 urls per chunk
    const delayMs = 5500; //5.5 sec delay between chunks

    //! build urls
    const urlObjects = await constructApiUrls();
    urls = urlObjects.map((obj) => obj.url);

    console.log(`There are ${urls.length} urls to fetch`); // >365
    //   console.log('last 10 urls: ', urls.slice(urls.length - 10, urls.length));

    // fetch chunked reflections
    const responses: (typeof exampleApiResponse | null)[] = [];
    // use urls.length for full dataset

    for (let i = 0; i < urls.length; i += chunkSize) {
      const chunk = urls.slice(i, i + chunkSize);

      const chunkResponses = await Promise.all(
        chunk.map(async (url) => {
          try {
            console.log(`Fetching ${url}`);
            const response = await fetch(url);

            if (!response.ok) {
              const wrapped = wrapErrorWithContext(
                new Error(`Failed to fetch daily reflection for url: ${url}`),
                ErrorType.EXTERNAL_SERVICE
              );
              console.error(wrapped.context);
              return null;
            }
            return response.json();
          } catch (error) {
            const wrapped = wrapErrorWithContext(error, ErrorType.NETWORK);
            console.error(wrapped.context);
            return null;
          }
        })
      );
      // add this chunk's responses to responses array
      responses.push(...chunkResponses);
      console.log(
        `Fetched ${chunkResponses.length} reflections, ${i}-${i + chunkResponses.length}, of ${urls.length} URLs`
      );

      // delay between chunks
      if (i + chunkSize < urls.length) {
        await delay(delayMs);
      }
    }

    // filter out null responses
    const data = responses.filter((response) => response !== null);
    console.log(`there are ${data.length} non-null responses`); //? 366

    // parse and write all reflections to db
    const writePromises = data.map(async (reflection) => {
      try {
        await sendToSupabase(reflection); // write to db
        //   console.log(`Successfully wrote ${reflection.Date} reflection to db`);
        return { status: 'Success', date: reflection.Date };
      } catch (error) {
        // console.error(
        //   `Error writing ${reflection.Date} reflection to db: `,
        //   error,
        // );
        const wrapped = wrapErrorWithContext(error, ErrorType.DATABASE);
        console.warn('error in: ', wrapped.context.functionName);
        console.log('error context:\n', wrapped.context);
        return { status: 'Fail', date: reflection.Date };
      }
    });

    results = await Promise.all(writePromises);
    return results;
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.NETWORK);
  }
};

const constructApiUrls = async (): Promise<{ url: string; date: string }[]> => {
  let objs: { url: string; date: string }[] = [];
  // build urls
  try {
    for (let month = 1; month <= 12; month++) {
      let monthString = month.toString().padStart(2, '0');
      for (let day = 1; day <= 31; day++) {
        let dayString = day.toString().padStart(2, '0');
        objs.push({
          url: `${apiUrl}/${monthString}${dayString}.json`,
          date: `${monthString}-${dayString}`,
        });
      }
    }
    return objs;
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.INTERNAL);
  }
};

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
const formatApiForDiscord = async (
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
 * - Writes the reflection to the Supabase DB
 * @param date the date to get Daily Reflection for
 * @returns The formatted discord embed
 */
const getFormattedReflection = async (date?: string): Promise<DiscordEmbed> => {
  try {
    // fetch the daily reflection
    const data = await fetchDailyReflection(date);

    // format the reflection for discord
    const discordEmbed = await formatApiForDiscord(data);

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
