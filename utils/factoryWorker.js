/**
 * Factory worker implementation.
 * 
 * This worker script processes individual factory files in separate threads.
 */

import { workerData, parentPort } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function processFactoryFile() {
  try {
    const { filePath } = workerData;
    const absPath = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);
    
    console.log(`Worker processing: ${path.basename(absPath)}`);
    
    // Import and execute the factory file
    // This will trigger monFactory.create() inside the file
    await import(absPath);
    
    // Send success message back to main thread
    parentPort.postMessage({
      status: 'completed',
      result: {
        file: path.basename(absPath),
        success: true
      }
    });
  } 
  catch (error) {
    console.error('Worker error:', error);
    parentPort.postMessage({
      status: 'error',
      error: error.message
    });
  }
}

// Execute the worker function
processFactoryFile();
