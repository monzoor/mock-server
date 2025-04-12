import fs from 'fs';
import path from 'path';
import { factoryFolder, dbDir, outputFile } from './constants.js';
import { redText } from './fileUtils.js';

export const readDirectory = async (dir) => {
  try {
    return await fs.promises.readdir(dir);
  } catch (err) {
    throw new Error(`Error reading directory ${dir}: ${err.message}`);
  }
};

export const runFactoryFiles = async () => {
  const files = await readDirectory(factoryFolder);
  for (const file of files.filter(file => file.endsWith('.js'))) {
    const filePath = path.join(factoryFolder, file);
    console.log(`Running file: ${file}`);
    await import(filePath);
  }
};

export const removeExtraDbFiles = async () => {
  const factoryFiles = (await readDirectory(factoryFolder)).filter(file => file.endsWith('.js'));
  const dbFiles = (await readDirectory(dbDir)).filter(file => file.endsWith('.json'));

  const factoryKeys = new Set(factoryFiles.map(file => path.basename(file, '.js')));
  const extraFiles = dbFiles.filter(file => !factoryKeys.has(path.basename(file, '.json')));

  for (const file of extraFiles) {
    const filePath = path.join(dbDir, file);
    await fs.promises.unlink(filePath);
    console.log(`Removed extra file: ${filePath}`);
  }
};

export const mergeJsonFiles = async () => {
  const files = (await readDirectory(dbDir)).filter(file => file.endsWith('.json'));
  const mergedData = {};

  for (const file of files) {
    const filePath = path.join(dbDir, file);
    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    Object.assign(mergedData, fileData);
  }

  await fs.promises.writeFile(outputFile, JSON.stringify(mergedData, null, 2));
  console.log(`Merged ${files.length} files into ${outputFile}`);
};
