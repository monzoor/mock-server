import fs from 'fs';

export const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
};

export const writeToFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

export const redText = (text) => `\x1b[31m${text}\x1b[0m`; // Function to wrap text in red color
