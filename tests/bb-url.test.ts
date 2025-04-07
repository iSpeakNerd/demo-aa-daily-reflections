import { buildBbMdUrl, getPageUrl, getPageNum } from '../utils/bb-url.ts';

async function runTests() {
  console.log('Running tests for bb-url.ts...');

  // Test for getPageNum
  console.log('Testing getPageNum...');
  const testPageNumber = 'Page 123';
  const pageNumResult = getPageNum(testPageNumber);
  console.log(`getPageNum('${testPageNumber}') = ${pageNumResult}`); // Expected: 123

  // Test for getPageUrl with valid book
  console.log('Testing getPageUrl with valid book...');
  const validBookParams = { book: 'ALCOHOLICS ANONYMOUS', pageNum: 123 };
  const validUrlResult = await getPageUrl(validBookParams);
  console.log(
    `getPageUrl(${JSON.stringify(validBookParams)}) = ${validUrlResult}`
  ); // Expected: URL string

  // Test for getPageUrl with invalid book
  console.log('Testing getPageUrl with invalid book...');
  const invalidBookParams = { book: 'OTHER BOOK', pageNum: 123 };
  const invalidUrlResult = await getPageUrl(invalidBookParams);
  console.log(
    `getPageUrl(${JSON.stringify(invalidBookParams)}) = ${invalidUrlResult}`
  ); // Expected: undefined

  // Test for buildBbMdUrl with valid inputs
  console.log('Testing buildBbMdUrl with valid inputs...');
  const validBuildParams = {
    book: 'ALCOHOLICS ANONYMOUS',
    pageNumber: 'Page 123',
  };
  const validBuildResult = await buildBbMdUrl(
    validBuildParams.book,
    validBuildParams.pageNumber
  );
  console.log(
    `buildBbMdUrl(${validBuildParams.book}, '${validBuildParams.pageNumber}') = ${validBuildResult}`
  ); // Expected: Markdown formatted URL

  // Test for buildBbMdUrl with invalid page number
  console.log('Testing buildBbMdUrl with invalid page number...');
  const invalidBuildParams = {
    book: 'ALCOHOLICS ANONYMOUS',
    pageNumber: 'No Page',
  };
  const invalidBuildResult = await buildBbMdUrl(
    invalidBuildParams.book,
    invalidBuildParams.pageNumber
  );
  console.log(
    `buildBbMdUrl(${invalidBuildParams.book}, '${invalidBuildParams.pageNumber}') = ${invalidBuildResult}`
  ); // Expected: undefined

  console.log('All tests completed.');
}

runTests();
