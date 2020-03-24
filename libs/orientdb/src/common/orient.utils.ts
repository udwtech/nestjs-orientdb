import { DEFAULT_DB_CONNECTIONTOKEN } from '../orientdb.constants';
import { Observable } from 'rxjs';
import { Logger } from '@nestjs/common';
import { delay, retryWhen, scan } from 'rxjs/operators';

export const getOrientClassToken = (orientClass: string): string =>
  `${orientClass}Token`;

/**
 * Generates Connection Token string
 * @param name connection token name
 *  - null : DEFAULT_DB_CONNECTIONTOKEN
 * @returns connectionToken
 */
export const getConnectionToken = (
  name: string = DEFAULT_DB_CONNECTIONTOKEN,
): string =>
  name !== DEFAULT_DB_CONNECTIONTOKEN ? `${name}` : DEFAULT_DB_CONNECTIONTOKEN;

/**
 *
 * @param retryAttempt
 * @param retryDelay
 */
export const handleRetry = (
  retryAttempt = 9,
  retryDelay = 3000,
): (<T>(source: Observable<T>) => Observable<T>) => {
  const logger = new Logger('OrientdbModule');

  return <T>(source: Observable<T>) =>
    source.pipe(
      retryWhen(e =>
        e.pipe(
          scan((errorCount, error) => {
            logger.error(
              `Unable to connect to database. Retrying (${errorCount + 1})...`,
              '',
            );

            if (errorCount + 1 >= retryAttempt) {
              throw error;
            }

            return errorCount + 1;
          }, 0),

          delay(retryDelay),
        ),
      ),
    );
};
