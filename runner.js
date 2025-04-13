/**
 * Mock data generation runner.
 * 
 * This module orchestrates the entire process of mock data generation.
 * It is responsible for executing all factory files, collecting their outputs,
 * and merging them into a single database file for json-server.
 * The main function serves as the entry point for the data generation process
 * and ensures all steps are executed in the correct order.
 */

import path from 'path';
import * as fileUtils from './utils/fileUtils.js';
import { extractFactoryKeys, getPaths } from './core/factoryCore.js';

const { factoryFolder, dbDir, outputFile } = getPaths();

/**
 * Run all factory files to generate mock data
 * @returns {Promise<void>}
 */
export const runFactoryFiles = async () => {
  try {
    fileUtils.ensureDirectoryExists(dbDir);
    const jsFiles = await fileUtils.readDirectoryFiles(factoryFolder, /\.js$/);
    
    for (const file of jsFiles) {
      const filePath = path.join(factoryFolder, file);
      console.log(`Running factory file: ${file}`);
      await import(filePath);
    }
    
    console.log('All factory files processed successfully');
  } catch (error) {
    console.error('Error running factory files:', error);
    throw error;
  }
};

/**
 * Merge all generated JSON files into one db.json file
 * @returns {Promise<void>}
 */
export const mergeJsonFiles = async () => {
  try {
    const factoryKeys = await extractFactoryKeys();
    const jsonFiles = await fileUtils.readDirectoryFiles(dbDir, /\.json$/);
    
    let mergedData = {};
    
    for (const file of jsonFiles) {
      const filePath = path.join(dbDir, file);
      const fileData = await fileUtils.readJsonFile(filePath);
      const fileKey = Object.keys(fileData)[0];
      
      if (factoryKeys.has(fileKey)) {
        mergedData = { ...mergedData, ...fileData };
      } else {
        console.log(`Removing redundant file: ${file}`);
        await fileUtils.deleteFile(filePath);
      }
    }
    
    await fileUtils.writeJsonFile(outputFile, mergedData);
    console.log(`Merged valid files into ${outputFile}`);
  } catch (error) {
    console.error('Error merging JSON files:', error);
    throw error;
  }
};

/**
 * Main function to run the entire process
 * @returns {Promise<void>}
 */
export const main = async () => {
  try {
    await runFactoryFiles();
    await mergeJsonFiles();
    console.log('Mock server data generation complete!');
  } catch (error) {
    console.error('Fatal error in mock server data generation:', error);
    process.exit(1);
  }
};

// Run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
