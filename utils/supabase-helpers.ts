import { wrapErrorWithContext, ErrorType } from './errors.ts';
import assert from 'assert';

export { getMonthName, getMonthNumber, formatMonthDay, makeDbDateString };

// month name => number, index + 1 = month number
// const monthsArray = [
//   'JANUARY',
//   'FEBRUARY',
//   'MARCH',
//   'APRIL',
//   'MAY',
//   'JUNE',
//   'JULY',
//   'AUGUST',
//   'SEPTEMBER',
//   'OCTOBER',
//   'NOVEMBER',
//   'DECEMBER',
// ];

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

// month number => name
const reverseMonthMap: { [key: string]: string } = Object.fromEntries(
  Object.entries(monthMap).map(([key, value]) => [value, key])
);

/**
 * Extracts and formats the month and day from the date string
 * @param dateString - The date string to parse // '12 JANUARY'
 * @returns The formatted month-day string `MM-DD` // '01-12'
 */
const formatMonthDay = async (dateString: string): Promise<string> => {
  try {
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

    const monthNumber = monthMap[monthMatch[1].toUpperCase()];
    const dayNumber = dayMatch[1].padStart(2, '0');
    return `${monthNumber}-${dayNumber}`;
  } catch (err) {
    throw wrapErrorWithContext(err);
  }
};

/**
 *
 * @param monthName // 'October'
 * @returns month number in MM format // '10'
 */
const getMonthNumber = (monthName: string): string => {
  try {
    const upperMonthName = monthName.toUpperCase();
    if (!Object.keys(monthMap).includes(upperMonthName)) {
      throw wrapErrorWithContext(
        `Month name provided does not exist: ${monthName}`,
        ErrorType.VALIDATION
      );
    }
    return monthMap[upperMonthName];
  } catch (err) {
    throw wrapErrorWithContext(err);
  }
};

/**
 *
 * @param monthNumber month of the year in MM format // '12'
 * @returns name of the month // 'DECEMBER'
 */
const getMonthName = (monthNumber: string): string => {
  try {
    // pad left to match map if needed
    const n = parseInt(monthNumber);
    assert(
      !isNaN(n) && n >= 1 && n <= 12,
      `month number is not valid ${monthNumber}`
    );
    const formattedMonthNumber =
      n >= 10 ? n.toString() : n.toString().padStart(2, '0'); // 01 through 12

    assert(
      Object.keys(reverseMonthMap).includes(formattedMonthNumber),
      `month number ${formattedMonthNumber} does not exist in reverseMonthMap`
    );
    return reverseMonthMap[formattedMonthNumber];
  } catch (err) {
    throw wrapErrorWithContext(err);
  }
};

const getMonthString = (monthIndex: number): string => {
  if (monthIndex < 0 || monthIndex > 11) {
    throw wrapErrorWithContext(
      `monthIndex out of bounds, should be between 0-11, got ${monthIndex}`,
      ErrorType.VALIDATION
    );
  }
  return (monthIndex + 1).toString().padStart(2, '0');
};

/** Makes the formatted date string for the database
 *
 * @returns formatted date_string // '06 MARCH'
 */
const makeDbDateString = (date: Date | string): string => {
  try {
    let parsedDate: Date;

    // Validation
    if (typeof date === 'string') {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw wrapErrorWithContext(
          `Invalid date string given: ${date}`,
          ErrorType.VALIDATION
        );
      }
    } else if (date instanceof Date) {
      parsedDate = date;
    } else {
      throw wrapErrorWithContext(
        `Expected Date object or valid date string, but received ${date} as ${typeof date}`,
        ErrorType.VALIDATION
      );
    }
    const day = parsedDate.getDate().toString();
    const monthName = getMonthName(
      (parsedDate.getMonth() + 1).toString()
    ).toUpperCase(); // DECEMBER

    return `${day} ${monthName}`; // '07 JANUARY'
  } catch (err) {
    throw wrapErrorWithContext(err);
  }
};
