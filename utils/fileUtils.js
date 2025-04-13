/**
 * File system utility functions.
 * 
 * This module provides a comprehensive set of utilities for file operations
 * that are commonly needed by the mock data generation system, including
 * reading/writing JSON files, directory management, and file manipulation.
 * These functions abstract away the complexities of the Node.js fs module
 * and provide error handling.
 */

import fs from 'fs/promises';
import { existsSync, writeFileSync, createWriteStream } from 'fs';
import { Transform } from 'stream';

/**
 * Ensures a directory exists, creates it if it doesn't
 * @param {string} dirPath - Directory path to check/create
 * @returns {Promise<void>}
 */
export const ensureDirectoryExists = async (dirPath) => {
  try {
    if (!existsSync(dirPath)) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  } catch (error) {
    console.error(`Error ensuring directory ${dirPath}:`, error);
    throw error;
  }
};

/**
 * Write data to a JSON file (async or sync based on mode)
 * @param {string} filePath - Path to write to
 * @param {object} data - Data to write
 * @param {boolean} [sync=false] - Whether to write synchronously
 */
export const writeJsonFile = async (filePath, data, sync = false) => {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    if (sync) {
      writeFileSync(filePath, jsonData, 'utf-8');
    } else {
      await fs.writeFile(filePath, jsonData, 'utf-8');
    }
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    throw error;
  }
};

/**
 * Read and parse a JSON file
 * @param {string} filePath - Path to read from
 * @returns {Promise<object>} Parsed JSON data
 */
export const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    throw error;
  }
};

/**
 * Read files from directory that match a pattern
 * @param {string} dir - Directory to read
 * @param {RegExp} pattern - Pattern to match (default: all files)
 * @returns {Promise<string[]>} Array of matching filenames
 */
export const readDirectoryFiles = async (dir, pattern = /.*/) => {
  try {
    const files = await fs.readdir(dir);
    return files.filter(file => pattern.test(file));
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    throw error;
  }
};

/**
 * Delete a file if it exists
 * @param {string} filePath - File path to delete
 * @returns {Promise<void>}
 */
export const deleteFile = async (filePath) => {
  try {
    if (existsSync(filePath)) {
      await fs.unlink(filePath);
    }
  } catch (error) {
    console.error(`Error deleting ${filePath}:`, error);
    throw error;
  }
};

/**
 * Stream data to a JSON file for large datasets
 * @param {string} filePath - Path to write to
 * @param {Object|Array} data - Data to write
 * @param {Object} [options] - Streaming options
 * @param {number} [options.highWaterMark=16384] - Buffer size
 * @param {boolean} [options.pretty=true] - Whether to prettify the JSON
 * @returns {Promise<void>}
 */
export const streamJsonToFile = async (filePath, data, options = {}) => {
  const { highWaterMark = 16384, pretty = true } = options;
  
  return new Promise((resolve, reject) => {
    try {
      const fileStream = createWriteStream(filePath, { highWaterMark });
      
      // Handle start of JSON
      const isArray = Array.isArray(data);
      fileStream.write(isArray ? '[' : '{');
      
      // Process object entries or array items with a Transform stream
      let isFirst = true;
      
      const jsonStream = new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          try {
            let jsonChunk;
            
            // Add comma if not the first item
            if (!isFirst) {
              this.push(',');
            } else {
              isFirst = false;
            }
            
            // Format key-value pair or array item
            if (!isArray && typeof chunk === 'object') {
              const [key, value] = chunk;
              jsonChunk = `"${key}":${JSON.stringify(value, null, pretty ? 2 : 0)}`;
            } else {
              jsonChunk = JSON.stringify(chunk, null, pretty ? 2 : 0);
            }
            
            this.push(jsonChunk);
            callback();
          } catch (err) {
            callback(err);
          }
        }
      });
      
      // Handle end of streaming
      jsonStream.on('end', () => {
        fileStream.write(isArray ? ']' : '}');
        fileStream.end();
      });
      
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
      jsonStream.on('error', reject);
      
      // Stream the data
      if (isArray) {
        // Stream array items
        for (const item of data) {
          jsonStream.write(item);
        }
      } else {
        // Stream object entries
        for (const entry of Object.entries(data)) {
          jsonStream.write(entry);
        }
      }
      
      jsonStream.end();
    } catch (error) {
      console.error(`Error streaming to ${filePath}:`, error);
      reject(error);
    }
  });
};

/**
 * Determine if data should use streaming based on size
 * @param {Object|Array} data - Data to check
 * @param {number} threshold - Size threshold in bytes (default: 10MB)
 * @returns {boolean} True if streaming should be used
 */
export const shouldUseStreaming = (data, threshold = 10 * 1024 * 1024) => {
  try {
    // Get approximate size by stringifying a small sample
    if (Array.isArray(data)) {
      if (data.length === 0) return false;
      
      const sampleSize = Math.min(10, data.length);
      const sample = data.slice(0, sampleSize);
      const sampleJson = JSON.stringify(sample);
      const estimatedSize = (sampleJson.length / sampleSize) * data.length;
      
      return estimatedSize > threshold;
    } else {
      const keys = Object.keys(data);
      if (keys.length === 0) return false;
      
      const sampleData = {};
      const sampleSize = Math.min(5, keys.length);
      
      for (let i = 0; i < sampleSize; i++) {
        sampleData[keys[i]] = data[keys[i]];
      }
      
      const sampleJson = JSON.stringify(sampleData);
      const estimatedSize = (sampleJson.length / sampleSize) * keys.length;
      
      return estimatedSize > threshold;
    }
  } catch (error) {
    console.warn('Error estimating data size, defaulting to regular write:', error);
    return false;
  }
};
