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
import { existsSync, writeFileSync } from 'fs';

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
