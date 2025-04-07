import fs from 'fs';
import path from 'path';

export { ErrorWithContext, wrapErrorWithContext, ErrorType };

enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  NOT_FOUND = 'NOT_FOUND',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  UNKNOWN = 'UNKNOWN',
  INTERNAL = 'INTERNAL',
}

const errorTypeToHttpStatusCode = {
  [ErrorType.VALIDATION]: 400,
  [ErrorType.AUTHENTICATION]: 401,
  [ErrorType.AUTHORIZATION]: 403,
  [ErrorType.NETWORK]: 502,
  [ErrorType.DATABASE]: 503,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.EXTERNAL_SERVICE]: 503,
  [ErrorType.UNKNOWN]: 500,
  [ErrorType.INTERNAL]: 500,
};

interface ErrorLogEntry {
  message: string;
  type: ErrorType;
  timestamp: string;
  functionName: string;
  stack?: string;
}

/**
 * Wraps an Error with additional context information
 *
 * - Provides a context property with stack trace, function name, timestamp, and type
 * - Can be nested to include multiple layers of context
 */
class ErrorWithContext extends Error {
  readonly originalError: Error;
  readonly context: {
    functionName: string;
    type: ErrorType;
    timestamp: string;
    stack: string;
  };

  constructor(error: Error, errorType?: ErrorType, functionName?: string) {
    super(error.message); // use original error message

    // set extended properties
    this.name = 'ErrorWithContext';
    this.originalError = error;
    this.context =
      error instanceof ErrorWithContext ?
        error.context // use existing context if already wrapped
      : {
          functionName: functionName || this.extractFunctionName(),
          type: errorType || ErrorType.UNKNOWN, // unspecified default to unknown
          timestamp: new Date().toISOString(),
          stack: error.stack || new Error().stack || 'Stack unavailable',
        };
  }

  /**
   * Helper utility: Extracts the function name from the stack trace
   * @returns The function name or 'Unknown function' if not found
   */
  private extractFunctionName(): string {
    const stackLines = this.stack?.split('\n') || [];
    // skip first line (error message) and second line (constructor)
    const callerLine = stackLines[2] || '';
    const functionMatch = callerLine.match(/at (\S+)/);
    return functionMatch ? functionMatch[1] : 'Unknown function';
  }
}

/**
 * Ensures errors are wrapped with additional context information.
 *
 * - If the error is already wrapped, it passes through
 * - If the error is not an instance of Error, it converts it to an Error then wraps
 */
function wrapErrorWithContext(
  error: unknown,
  errorType?: ErrorType,
  functionName?: string
): ErrorWithContext {
  // already wrapped, pass through
  if (error instanceof ErrorWithContext) {
    return error;
  } else {
    // convert unknowns to Error type
    const actualError =
      error instanceof Error ? error : new Error(String(error));
    // wrap with context, fallback error type UNKNOWN
    const wrapped = new ErrorWithContext(
      actualError,
      errorType || ErrorType.UNKNOWN,
      functionName
    );

    // Log the error, but don't wrap any logging errors to prevent recursion
    try {
      logError(wrapped);
    } catch (loggingError) {
      console.error('failed to log error:', loggingError);
      logLoggingError(
        loggingError instanceof Error ? loggingError : (
          new Error(String(loggingError))
        )
      );
    }

    return wrapped;
  }
}

/**
 * Logs an error to file
 * @param error - The standard error object to log
 */
function logError(error: ErrorWithContext): void {
  const logEntry: ErrorLogEntry = {
    message: error.message,
    type: error.context.type,
    timestamp: error.context.timestamp,
    functionName: error.context.functionName,
    stack: error.stack,
  };

  //TODO: add external logging service
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD

  // // create logs directory if it doesn't exist
  // const logsDir = path.join(process.cwd(), 'logs');
  // if (!fs.existsSync(logsDir)) {
  //   fs.mkdirSync(logsDir, { recursive: true });
  // }

  // const logFilePath = path.join(logsDir, `errors-${dateString}.log`);
  // fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n\n');
  console.error('Error log:', logEntry);
}

/**
 * Fallback for logging logging-errors to file
 * @param error - The standard error object to log
 */
function logLoggingError(error: Error): void {
  const fallbackEntry = {
    message: `LOGGING_SERVICE_ERROR: ${error.message}`,
    timestamp: new Date().toISOString(),
    stack: error.stack,
  };

  try {
    // const logsDir = path.join(process.cwd(), 'logs');
    // if (!fs.existsSync(logsDir)) {
    //   fs.mkdirSync(logsDir, { recursive: true });
    // }
    // const fallbackPath = path.join(logsDir, 'logging-errors.log');
    // fs.appendFileSync(fallbackPath, JSON.stringify(fallbackEntry) + '\n\n');
  } catch (criticalError) {
    console.error(
      'CRITICAL: Failed to log logging service error:',
      criticalError
    );
  }
}
