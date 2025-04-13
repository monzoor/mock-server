/**
 * Worker utilities for parallel processing.
 * 
 * This module provides functionality to distribute factory file processing
 * across multiple worker threads for improved performance.
 */

import { Worker } from 'worker_threads';
import path from 'path';
import os from 'os';

/**
 * Creates and manages worker threads for parallel processing
 * @param {string[]} files - Array of file paths to process
 * @param {number} [maxWorkers] - Maximum number of parallel workers (defaults to CPU count)
 * @returns {Promise<void>}
 */
export const runWithWorkers = async (files, maxWorkers = os.cpus().length) => {
  // Use OS CPU count as default, but cap at file count
  const workerCount = Math.min(maxWorkers, files.length);
  console.log(`Starting ${workerCount} workers to process ${files.length} files`);
  
  // Create task queue from files
  const taskQueue = [...files];
  const activeWorkers = new Set();
  const results = [];

  return new Promise((resolve, reject) => {
    // Handler for worker completion
    const workerCompleteHandler = (worker) => {
      activeWorkers.delete(worker);
      
      if (taskQueue.length > 0) {
        // More tasks to process
        const nextFile = taskQueue.shift();
        startWorker(nextFile);
      } else if (activeWorkers.size === 0) {
        // All work is done
        console.log('All worker threads completed');
        resolve(results);
      }
    };

    // Create and start a worker for a file
    const startWorker = (file) => {
      const workerScript = path.resolve('./utils/factoryWorker.js');
      const worker = new Worker(workerScript, {
        workerData: { filePath: file }
      });

      activeWorkers.add(worker);

      worker.on('message', (message) => {
        if (message.status === 'completed') {
          results.push(message.result);
          workerCompleteHandler(worker);
        }
      });

      worker.on('error', (err) => {
        console.error(`Worker error processing ${file}:`, err);
        workerCompleteHandler(worker);
        // Don't reject, allow other workers to continue
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Worker exited with code ${code}`);
        }
      });
    };

    // Initialize workers up to workerCount
    const initialBatch = taskQueue.splice(0, workerCount);
    initialBatch.forEach(startWorker);

    // Handle empty file list
    if (initialBatch.length === 0) {
      resolve([]);
    }
  });
};
