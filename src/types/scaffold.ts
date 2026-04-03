export type ProjectType = 'onprem' | 'saas' | 'standalone';

export type DeployTarget = 'vercel' | 'azure';

export type DatabaseType = 'sqlserver' | 'postgresql' | 'mongodb';

export type FrontendType = 'nextjs' | 'angular' | 'react-vite';

export type MongoMode = 'local' | 'atlas';

export interface ScaffoldConfig {
  /** Project type: on-premise (Express+Aspire), SaaS (Azure Functions), or standalone PoC */
  projectType: ProjectType;
  /** kebab-case project name, e.g. "asset-tracker" */
  pluginName: string;
  /** PascalCase class name, derived from pluginName, e.g. "AssetTracker" */
  pluginClassName: string;
  /** Short description of the project */
  description: string;
  /** Author name */
  author: string;
  /** Whether to include a frontend (Angular for plugin types, chosen framework for standalone) */
  includeFrontend: boolean;
  /** Deployment target for standalone projects: Vercel or Azure (full stack via Aspire) */
  deployTarget?: DeployTarget;
  /** Database engine for standalone projects */
  database?: DatabaseType;
  /** Frontend framework for standalone projects */
  frontend?: FrontendType;
  /** MongoDB connection mode: local Docker or Atlas cloud */
  mongoMode?: MongoMode;
  /** Absolute path to the output directory */
  outputDir: string;
}
