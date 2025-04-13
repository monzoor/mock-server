/**
 * File system utility functions.
 * 
 * This module provides a comprehensive set of utilities for file operations
 * that are commonly needed by the mock data generation system, including
 * reading/writing JSON files, directory management, and file manipulation.
 * These functions abstract away the complexities of the Node.js fs module
 * and provide error handling.
 */

import fs from 'fs';
import { existsSync, writeFileSync, createWriteStream } from 'fs';
import path from 'path';
import { Transform } from 'stream';

/**
 * Ensures a directory exists, creates it if it doesn't
 * @param {string} dirPath - Directory path to check/create
 * @returns {Promise<void>}
 */
export const ensureDirectoryExists = async (dirPath) => {
  try {
    if (!existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
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
      await fs.promises.writeFile(filePath, jsonData, 'utf-8');
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
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    throw error;
  }
};

/**
 * Read all files matching pattern from a directory
 * @param {string} directory - Directory path to read from
 * @param {RegExp} pattern - Pattern to match files against
 * @returns {Promise<string[]>} Array of file names
 */
export const readDirectoryFiles = async (directory, pattern) => {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        console.error(`Error reading directory ${directory}:`, err);
        reject(err);
        return;
      }
      
      const matchingFiles = files.filter(file => pattern.test(file));
      console.log(`Found ${matchingFiles.length} files matching pattern in ${directory}:`, matchingFiles);
      resolve(matchingFiles);
    });
  });
};

/**
 * Delete a file if it exists
 * @param {string} filePath - File path to delete
 * @returns {Promise<void>}
 */
export const deleteFile = async (filePath) => {
  try {
    if (existsSync(filePath)) {
      await fs.promises.unlink(filePath);
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

/**
 * Clean a directory by removing all files with specified extension
 * @param {string} dirPath - Directory path to clean
 * @param {string} [extension='.json'] - File extension to target for removal
 * @returns {Promise<string[]>} List of removed files
 */
export const cleanDirectory = async (dirPath, extension = '.json') => {
  try {
    console.log(`Cleaning directory: ${dirPath} (removing ${extension} files)`);
    
    // Check if directory exists
    if (!existsSync(dirPath)) {
      console.log(`Directory ${dirPath} does not exist, nothing to clean`);
      return [];
    }
    
    // Read directory contents
    const files = await fs.promises.readdir(dirPath);
    const targetFiles = files.filter(file => file.toLowerCase().endsWith(extension));
    
    if (targetFiles.length === 0) {
      console.log(`No ${extension} files found in ${dirPath}, nothing to clean`);
      return [];
    }
    
    console.log(`Found ${targetFiles.length} ${extension} files to remove`);
    
    // Remove each matching file
    const removedFiles = [];
    for (const file of targetFiles) {
      const filePath = path.join(dirPath, file);
      await fs.promises.unlink(filePath);
      removedFiles.push(file);
    }
    
    console.log(`✓ Removed ${removedFiles.length} old files from ${dirPath}`);
    return removedFiles;
  } catch (error) {
    console.error(`Error cleaning directory ${dirPath}:`, error);
    throw error;
  }
};

/**
 * Merge multiple JSON files into a single JSON file
 * @param {string} sourceDir - Directory containing JSON files
 * @param {string} outputFile - Path to output merged file
 * @param {string[]} keys - Array of keys to include (should match filenames without extension)
 * @returns {Promise<void>}
 */
export const mergeJsonFiles = async (sourceDir, outputFile, keys) => {
  try {
    console.log(`Merging JSON files for keys: ${keys.join(', ')}`);
    const result = {};
    
    for (const key of keys) {
      const filePath = path.join(sourceDir, `${key}.json`);
      try {
        if (existsSync(filePath)) {
          const fileContent = await fs.promises.readFile(filePath, 'utf8');
          const data = JSON.parse(fileContent);
          if (data && data[key]) {
            result[key] = data[key];
            console.log(`✓ Successfully merged data for key: ${key}`);
          } else {
            console.warn(`⚠️ Data for key "${key}" not found in ${filePath}`);
          }
        } else {
          console.warn(`⚠️ JSON file not found: ${filePath}`);
        }
      } catch (fileError) {
        console.error(`Error processing ${filePath}:`, fileError);
        // Continue with other files instead of failing completely
      }
    }
    
    // Write the merged result to the output file
    await writeJsonFile(outputFile, result, true);
    console.log(`✓ Successfully created merged JSON file: ${outputFile}`);
    return result;
  } catch (error) {
    console.error('Error merging JSON files:', error);
    throw error;
  }
};