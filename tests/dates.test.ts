import { getMonthName, makeDbDateString } from '../utils/supabase-helpers.ts';
import { db } from 'utils/supabase.ts';

const testString1 = '1 april';

function dateTest(testDate: string) {
  let date = new Date(testString1);
  const test_obj = {
    day_of_month: date.getDate(), // 10
    monthIndex: date.getMonth(), // 1
    monthExpected: date.getMonth() + 1, // 2
    monthName: getMonthName((date.getMonth() + 1).toString()), // FEBRUARY
    date_string_String: makeDbDateString(testDate), // '10 FEBRUARY'
    date_string_Date: makeDbDateString(date), // '10 FEBRUARY'
  };
  console.log(test_obj);
}

dateTest(testString1);
