import { wrapErrorWithContext, ErrorType } from './errors.ts';

//! string utility functions
export { removeLineBreaks, makeSentenceCase, formatDate };

/**
 * Processes a string to replace line breaks with spaces
 * and trim leading/trailing whitespace
 *
 * @param str - The string to process
 * @returns The processed string
 */
async function removeLineBreaks(str: string): Promise<string> {
  try {
    return str.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.INTERNAL);
  }
}

/** Utility function for sentence case formatting
 * @param str - The string to format // "14 OCTOBER HELLO WORLD"
 * @returns The formatted string in sentence case // "14 October Hello World"
 */
async function makeSentenceCase(str: string): Promise<string> {
  try {
    let words: string[] = str.split(' ');
    // console.log(words);
    let phrase: string = '';
    words.map((word) => {
      phrase +=
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() + ' ';
    });
    return phrase.trim();
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.INTERNAL);
  }
}

/** Utility function for sentence case formatting the date
 * @param dateString - The date string from the API // "14 OCTOBER"
 * @returns The formatted date string in sentence case // "14 October"
 */
async function formatDate(dateString: string): Promise<string> {
  try {
    const [day, month] = dateString.split(' ');
    return `${day} ${month.charAt(0)}${month.slice(1).toLowerCase()}`;
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.INTERNAL);
  }
}
