//! Database utils, parsing for and updating + reading DB

import { createClient, QueryData, QueryError } from '@supabase/supabase-js';
import { Tables, TablesInsert, TablesUpdate } from '../_types/db.types.ts';
import {
  exampleApiResponse,
  fetchDailyReflection,
} from './discord-reflections.ts';
import { removeLineBreaks } from './strings.ts';
import dotenv from 'dotenv';
import { wrapErrorWithContext, ErrorType } from './errors.ts';
import { formatMonthDay, makeDbDateString } from './supabase-helpers.ts';

export { parseApiForDB, db };

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
 * Writes the daily reflection to the supabase DB
 * @param reflection - The daily reflection prepared as db insert object
 * @returns The updated daily reflection from supabase DB
 */
const createDailyReflectionInDb = async (
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

const readDailyReflectionFromDb = async (
  dateString: string
): Promise<Tables<'AA_Daily_Reflections'>> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('AA_Daily_Reflections')
      .select()
      .eq('date_string', dateString)
      .single();
    if (error) {
      wrapErrorWithContext(error, ErrorType.DATABASE);
    }

    return data;
  } catch (err) {
    throw wrapErrorWithContext(err);
  }
};

/**
 * Updates the daily reflection in the supabase DB
 * @param reflection - The daily reflection prepared as db update object
 * @returns The updated daily reflection from supabase DB
 */
const updateDailyReflectionInDb = async (
  reflection: TablesUpdate<'AA_Daily_Reflections'>
) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('AA_Daily_Reflections')
      .update(reflection)
      .eq('date_string', reflection.date_string) // Using date_string as the unique identifier
      .select()
      .maybeSingle();

    if (error) {
      wrapErrorWithContext(error, ErrorType.DATABASE);
    }

    return data;
  } catch (error) {
    wrapErrorWithContext(error);
  }
};

/**
 * Deletes the daily reflection from the supabase DB
 * @param dateString - The unique identifier for the reflection to delete
 * @returns The deleted reflection data from supabase DB
 */
const deleteDailyReflectionFromDb = async (dateString: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('AA_Daily_Reflections')
      .delete()
      .eq('date_string', dateString) // Using date_string as the unique identifier
      .select()
      .maybeSingle();

    if (error) {
      wrapErrorWithContext(error, ErrorType.DATABASE);
    }

    return data;
  } catch (error) {
    wrapErrorWithContext(error);
  }
};

// ####################################
//  CRUD
const db = {
  CRUD: {
    create: createDailyReflectionInDb,
    read: readDailyReflectionFromDb,
    update: updateDailyReflectionInDb,
    delete: deleteDailyReflectionFromDb,
  },
};
// ####################################
