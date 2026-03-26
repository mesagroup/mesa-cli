export interface ScaffoldConfig {
  /** kebab-case plugin name, e.g. "asset-tracker" */
  pluginName: string;
  /** PascalCase class name, derived from pluginName, e.g. "AssetTracker" */
  pluginClassName: string;
  /** Short description of the plugin */
  description: string;
  /** Author name */
  author: string;
  /** Whether to include Angular 16 frontend */
  includeFrontend: boolean;
  /** Absolute path to the output directory */
  outputDir: string;
}
