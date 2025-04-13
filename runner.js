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
import fs from 'fs';
import * as fileUtils from './utils/fileUtils.js';
import { extractFactoryKeys, getPaths } from './core/factoryCore.js';
import { Worker } from 'worker_threads';
import { configManager } from './config/configManager.js';

const { factoryFolder, dbDir, outputFile } = getPaths();

/**
 * Process a factory file using worker threads
 * @param {string} filePath - Path to the factory file
 * @returns {Promise<Object>} Result of the processing
 */
const processFileWithWorker = (filePath) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./utils/factoryWorker.js', {
      workerData: { filePath }
    });

    worker.on('message', (message) => {
      if (message.status === 'completed') {
        resolve(message.result);
      } else if (message.status === 'error') {
        reject(new Error(message.error));
      }
    });

    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
};

/**
 * Process a factory file directly in the current process
 * @param {string} filePath - Path to the factory file
 * @returns {Promise<Object>} Result of the processing
 */
const processFileDirect = async (filePath) => {
  try {
    await import(filePath);
    return {
      file: path.basename(filePath),
      success: true
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Run all factory files to generate mock data
 * @returns {Promise<void>}
 */
export const runFactoryFiles = async () => {
  try {
    // Ensure the directory exists
    fileUtils.ensureDirectoryExists(dbDir);
    
    // Clean the db directory to remove old files
    await fileUtils.cleanDirectory(dbDir);
    
    // Get all JS files from the factory folder
    const files = await fs.promises.readdir(factoryFolder);
    const jsFiles = files.filter(file => file.toLowerCase().endsWith('.js'));
    
    console.log(`Found ${jsFiles.length} factory files to process: ${jsFiles.join(', ')}`);
    
    const results = {
      succeeded: [],
      failed: []
    };
    
    // Determine if we should process in parallel
    const useParallel = configManager.get('processing.parallel');
    
    if (useParallel) {
      console.log('Processing factory files in parallel using workers...');
      const promises = jsFiles.map(file => {
        const filePath = path.join(factoryFolder, file);
        return processFileWithWorker(filePath)
          .then(result => {
            console.log(`✓ Successfully processed: ${file}`);
            results.succeeded.push(file);
            return result;
          })
          .catch(error => {
            console.error(`✗ Error processing factory file ${file}:`, error);
            results.failed.push({ file, error: error.message });
            return { file, success: false, error: error.message };
          });
      });
      
      await Promise.all(promises);
    } else {
      console.log('Processing factory files sequentially...');
      for (const file of jsFiles) {
        const filePath = path.join(factoryFolder, file);
        console.log(`Running factory file: ${file}`);
        try {
          await processFileDirect(filePath);
          console.log(`✓ Successfully processed: ${file}`);
          results.succeeded.push(file);
        } catch (error) {
          console.error(`✗ Error processing factory file ${file}:`, error);
          results.failed.push({ file, error: error.message });
        }
      }
    }
    
    if (results.failed.length > 0) {
      console.warn(`⚠️ ${results.failed.length} factory files failed to process:`);
      results.failed.forEach(failure => {
        console.warn(`  - ${failure.file}: ${failure.error}`);
      });
    }
    
    console.log(`✓ Successfully processed ${results.succeeded.length} out of ${jsFiles.length} factory files`);
  } catch (error) {
    console.error('Error running factory files:', error);
    throw error;
  }
};

/**
 * Main function to generate mock data
 * @returns {Promise<void>}
 */
export async function main() {
  try {
    console.log('Starting mock data generation...');
    
    // Load configuration
    configManager.load();
    
    // Execute factory files
    await runFactoryFiles();
    
    // Extract keys and generate the final JSON database
    const keys = await extractFactoryKeys();
    console.log(`Found keys: ${Array.from(keys).join(', ')}`);
    
    await fileUtils.mergeJsonFiles(dbDir, outputFile, Array.from(keys));
    console.log(`✓ Mock data successfully generated in ${outputFile}`);
  } catch (error) {
    console.error('Error generating mock data:', error);
    throw error;
  }
}

// Run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1); // Exit with error code to prevent json-server from starting
  });
}
