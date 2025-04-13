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
    fileUtils.ensureDirectoryExists(dbDir);
    
    const { key, data } = createMockData(config, templateFn);
    
    const filePath = path.join(dbDir, `${key}.json`);
    fileUtils.writeJsonFile(filePath, data, true);
    
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
