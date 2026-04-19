import type { ScaffoldConfig } from '../../types/scaffold';
import * as sqlserver from './sqlserver';
import * as postgresql from './postgresql';
import * as mongodb from './mongodb';

export type DbModule = typeof sqlserver;

/**
 * Returns the db module matching config.database. Defaults to SQL Server
 * for project types that don't expose a database choice (onprem, saas).
 */
export function getDbModule(config: ScaffoldConfig): DbModule {
  switch (config.database) {
    case 'postgresql':
      return postgresql;
    case 'mongodb':
      return mongodb;
    default:
      return sqlserver;
  }
}
