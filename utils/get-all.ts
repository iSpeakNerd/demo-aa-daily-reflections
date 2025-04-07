import { wrapErrorWithContext, ErrorType } from './errors.ts';
import {
  apiUrl,
  exampleApiResponse,
  sendToSupabase,
} from './discord-reflections.ts';

const delay = async (ms: number) => {
  try {
    console.log(`delaying ${ms} ms`);
    return new Promise((resolve) => setTimeout(resolve, ms));
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.INTERNAL);
  }
};

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
