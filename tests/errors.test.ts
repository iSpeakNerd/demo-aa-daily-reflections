import { wrapErrorWithContext, ErrorType } from '../utils/errors.ts';

function errorTest() {
  try {
    throw new Error('test error');
  } catch (error) {
    wrapErrorWithContext(error, ErrorType.UNKNOWN);
  }
}

errorTest();
