import { ErrorType, wrapErrorWithContext } from './errors.ts';

export { wrapMdUrl };

/** wraps text as a markdown formatted url */
async function wrapMdUrl(text: string, pageNumber?: string, url?: string) {
  return url ? `[${text}, ${pageNumber}](${url})` : `${text}, ${pageNumber}`;
}
