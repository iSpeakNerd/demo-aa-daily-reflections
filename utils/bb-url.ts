import { ErrorType, wrapErrorWithContext } from './errors.ts';
import { wrapMdUrl } from './md-helpers.ts';

export { buildBbMdUrl, getPageNum, getPageUrl };

/** creates the url for the specified page on anonpress.org for Big Book pages only
 *
 * @param params bookName and pageNum
 * @returns if the book is 'ALCOHOLICS ANONYMOUS', gives url to the page otherwise undefined
 */
async function getPageUrl(params: { book: string; pageNum: number }) {
  try {
    const { book, pageNum } = params;
    if (book === 'ALCOHOLICS ANONYMOUS') {
      const url = new URL(`https://anonpress.org/bb/Page_${pageNum}.htm`);
      return url.href;
    } else return;
  } catch (err) {
    throw wrapErrorWithContext(err, ErrorType.INTERNAL);
  }
}

/** extracts page number and converts to number type
 * @returns if no numbers found, undefined */
const getPageNum = (pageNumber: string) => {
  try {
    const numberPattern = /(\d+)/g;
    const num = pageNumber.match(numberPattern)![0];
    if (num) {
      return parseInt(num);
    }
    return undefined;
  } catch (err) {
    throw wrapErrorWithContext(err, ErrorType.INTERNAL);
  }
};

/**
 * Logic for creating a markdown-formatted url to Big Book pages
 * for the discord embed
 * @param book
 * @param pageNumber
 * @returns if no page number, returns undefined. if no url, fallback to book name alone.
 */
async function buildBbMdUrl(book: string, pageNumber: string) {
  try {
    const pageNum = getPageNum(pageNumber);
    if (!pageNum) {
      return;
    }
    const url = await getPageUrl({ book, pageNum });
    return wrapMdUrl(book, pageNumber, url);
  } catch (err) {
    throw wrapErrorWithContext(err, ErrorType.INTERNAL);
  }
}
