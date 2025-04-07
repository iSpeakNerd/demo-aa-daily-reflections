//! Database utils, parsing for and updating + reading DB

import { createClient, QueryData, QueryError } from '@supabase/supabase-js';
import { Tables, TablesInsert } from '../_types/db.types.ts';
import {
  exampleApiResponse,
  fetchDailyReflection,
} from './discord-reflections.ts';
import { removeLineBreaks } from './strings.ts';
import dotenv from 'dotenv';
import { wrapErrorWithContext, ErrorType } from './errors.ts';

export { parseApiForDB, writeDailyReflectionToDb };

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw wrapErrorWithContext(
    new Error('Supabase URL or service role key not found'),
    ErrorType.NOT_FOUND
  );
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export { supabaseAdmin };

/**
 * Writes the daily reflection to the supabase DB
 * @param reflection - The daily reflection prepared as db insert object
 * @returns The updated daily reflection from supabase DB
 */
const writeDailyReflectionToDb = async (
  reflection: TablesInsert<'AA_Daily_Reflections'>
) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('AA_Daily_Reflections')
      .upsert(reflection, {
        onConflict: 'date_string',
        ignoreDuplicates: true,
      })
      .select()
      .maybeSingle();
    if (error) {
      //no throw on write error
      wrapErrorWithContext(error, ErrorType.DATABASE);
    }
    // console.log('wrote to db', data);
    return data;
  } catch (error) {
    wrapErrorWithContext(error);
  }
};

/**
 * Parses the API response for the supabase DB
 * @param reflection - The JSON response from the API
 * @returns The parsed response
 */
const parseApiForDB = async (
  reflection: typeof exampleApiResponse
): Promise<TablesInsert<'AA_Daily_Reflections'>> => {
  try {
    const { Title, Quote, Date: date_str, Comment } = reflection;

    const obj: TablesInsert<'AA_Daily_Reflections'> = {
      title: Title,
      date_string: date_str,
      month_day: await formatMonthDay(date_str),
      reflection: await removeLineBreaks(Comment),
      quote_text: await removeLineBreaks(Quote.Text),
      page_number: parseInt(Quote.PageNumber.split(' ')[1]),
      book_name: Quote.BookName,
    };
    return obj;
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.INTERNAL);
  }
};

/**
 * Extracts and formats the month and day from the date string
 * @param dateString - The date string to parse // '12 JANUARY'
 * @returns The formatted month-day string `MM-DD` // '01-12'
 */
const formatMonthDay = async (dateString: string): Promise<string> => {
  try {
    const monthMap: { [key: string]: string } = {
      JANUARY: '01',
      FEBRUARY: '02',
      MARCH: '03',
      APRIL: '04',
      MAY: '05',
      JUNE: '06',
      JULY: '07',
      AUGUST: '08',
      SEPTEMBER: '09',
      OCTOBER: '10',
      NOVEMBER: '11',
      DECEMBER: '12',
    };

    const monthMatch = dateString.match(/\d{1,2} (\w+)/);
    const dayMatch = dateString.match(/(\d{1,2}) \w+/);

    if (!monthMatch) {
      throw wrapErrorWithContext(
        'Error: unable to match month in dateString',
        ErrorType.VALIDATION
      );
    }
    if (!dayMatch) {
      throw wrapErrorWithContext(
        'Error: unable to match day in dateString',
        ErrorType.VALIDATION
      );
    }

    const month = monthMap[monthMatch[1].toUpperCase()];
    const day = dayMatch[1].padStart(2, '0');
    return `${month}-${day}`;
  } catch (err) {
    throw wrapErrorWithContext(err);
  }
};
