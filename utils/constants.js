import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const factoryFolder = path.join(__dirname, '../factory');
export const dbDir = path.join(__dirname, '../db');
export const outputFile = path.join(__dirname, '../db.json');
