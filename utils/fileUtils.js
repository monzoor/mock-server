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
import path from 'path';

/**
 * Ensures a directory exists, creates it if it doesn't
 * @param {string} dirPath - Directory path to check/create
 */
export const ensureDirectoryExists = (dirPath) => {
  if (!existsSync(dirPath)) {
    fs.mkdir(dirPath, { recursive: true });
  }
};

/**
 * Write data to a JSON file
 * @param {string} filePath - Path to write to
 * @param {object} data - Data to write
 * @returns {Promise<void>}
 */
export const writeJsonFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    throw error;
  }
};

/**
 * Write data to a JSON file synchronously
 * @param {string} filePath - Path to write to
 * @param {object} data - Data to write
 */
export const writeJsonFileSync = (filePath, data) => {
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
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
