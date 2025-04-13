/**
 * Mock data factory system entry point.
 * 
 * This module serves as the main factory implementation for creating
 * mock data. It exports the monFactory object which provides methods
 * to generate structured mock data based on templates and save them
 * to JSON files for consumption by json-server.
 * 
 * The factory pattern implemented here allows for consistent data
 * generation across the application while ensuring proper file
 * structure and organization.
 */

import path from 'path';
import * as fileUtils from './utils/fileUtils.js';
import { createMockData, getPaths } from './core/factoryCore.js';
import { main } from './runner.js';
import { configManager } from './config/configManager.js';

const { dbDir } = getPaths();

/**
 * Factory for creating mock data and saving to JSON
 */
export const monFactory = {
  /**
   * Create mock data based on config and template function
   * @param {Object} config - Configuration with _key and _repeat options
   * @param {Function} templateFn - Template function to generate data
   * @returns {Object} Created mock data
   */
  create: (config, templateFn) => {
    // Apply configuration overrides from config manager
    const entityKey = config._key;
    const configuredRepeat = configManager.getRepeatForEntity(entityKey);
    
    // Only override _repeat if it's not explicitly set in the factory file
    const effectiveConfig = { ...config };
    if (!('_repeat' in config) && configuredRepeat) {
      effectiveConfig._repeat = configuredRepeat;
    }
    
    // Ensure directory exists
    fileUtils.ensureDirectoryExists(dbDir);
    
    // Generate mock data
    const { key, data } = createMockData(effectiveConfig, templateFn);
    
    // Determine if we should use streaming based on data size
    const filePath = path.join(dbDir, `${key}.json`);
    const useStreaming = configManager.get('factory.useStreaming') && 
      fileUtils.shouldUseStreaming(data, configManager.get('factory.streamingThreshold'));
    
    // Write data using appropriate method
    if (useStreaming) {
      fileUtils.streamJsonToFile(filePath, data, {
        pretty: configManager.get('output.pretty')
      });
    } else {
      fileUtils.writeJsonFile(filePath, data, true);
    }
    
    return data;
  }
};

// Export main for direct execution
export { main };

// Run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1); // Exit with error code to prevent json-server from starting
  });
}
