/**
 * Core factory functionality module.
 * 
 * This module provides the essential functions for the mock data generation system.
 * It handles path resolution, data structure creation, and key management
 * for the factory system. It serves as the backbone for all data generation
 * operations, ensuring consistency across the mock server.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import * as fileUtils from '../utils/fileUtils.js';
import fs from 'fs';

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const FACTORY_FOLDER = path.join(PROJECT_ROOT, 'factory');
const DB_DIR = path.join(PROJECT_ROOT, 'db');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'db.json');

/**
 * Create mock data based on configuration and template
 * @param {Object} config - Configuration with _key and _repeat options
 * @param {Function} templateFn - Template function that generates data
 * @returns {Object} Created data with appropriate key
 * @throws {Error} If _repeat value is negative
 * @throws {Error} If _key is missing, empty, null or undefined
 */
export const createMockData = (config, templateFn) => {
  // Validate key
  if (!('_key' in config)) {
    throw new Error('_key must be specified in configuration');
  }
  
  if (typeof config._key !== 'string' || config._key.trim() === '') {
    throw new Error('_key cannot be empty or non-string value');
  }
  
  const hasExplicitRepeat = '_repeat' in config;
  const count = config._repeat || 1;
  
  // Validate repeat count
  if (count < 0) {
    throw new Error(`_repeat value cannot be negative (received ${count})`);
  }
  
  const key = config._key;
  
  let data;
  if (hasExplicitRepeat || count > 1) {
    data = Array.from({ length: count }, (_, i) => {
      const item = { ...templateFn(i) };
      const id = i + 1;
      delete item._repeat;
      return { id, ...item };
    });
  } else {
    const item = { ...templateFn(0) };
    const id = 1;
    delete item._repeat;
    data = { id, ...item };
  }

  return { key, data: { [key]: data } };
};

/**
 * Extract keys from factory files
 * @returns {Promise<Set<string>>} Set of keys found in factory files
 */
export const extractFactoryKeys = async () => {
  try {
    let jsFiles = [];
    try {
      jsFiles = await fileUtils.readDirectoryFiles(FACTORY_FOLDER, /\.js$/);
    } catch (error) {
      console.warn("Error reading factory directory, falling back to process.cwd():", error);
      
      // Fallback to direct file reading using current directory + '/factory'
      const factoryPath = path.join(process.cwd(), 'factory');
      jsFiles = await new Promise((resolve, reject) => {
        fs.readdir(factoryPath, (err, files) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(files.filter(file => /\.js$/.test(file)));
        });
      });
    }
    
    const keys = new Set();
    
    for (const file of jsFiles) {
      try {
        const filePath = path.join(FACTORY_FOLDER, file);
        const fileContent = await fs.promises.readFile(filePath, 'utf8');
        
        const match = fileContent.match(/_key:\s*["']([^"']+)["']/);
        if (match) {
          keys.add(match[1]);
        }
      } catch (error) {
        console.warn(`Error extracting key from ${file}:`, error);
        // Continue with next file
      }
    }
    
    return keys;
  } catch (error) {
    console.error('Error extracting keys:', error);
    // Return empty set instead of throwing
    return new Set();
  }
};

/**
 * Get paths to important directories and files
 * @returns {Object} Object containing paths
 */
export const getPaths = () => ({
  factoryFolder: FACTORY_FOLDER,
  dbDir: DB_DIR,
  outputFile: OUTPUT_FILE
});
