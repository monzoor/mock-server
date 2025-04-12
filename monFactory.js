import { ensureDirectoryExists, writeToFile, redText } from './utils/fileUtils.js';
import { dbDir } from './utils/constants.js';
import { generateData } from './utils/dataUtils.js';
import { removeExtraDbFiles, mergeJsonFiles, runFactoryFiles } from './utils/fileOperations.js';

export const monFactory = {
  create: ({ _key, _template, count = 1 }) => {
    if (!_key || typeof _key !== 'string') {
      throw new Error('"_key" must be a non-empty string.');
    }

    if (typeof _template !== 'object' || _template === null) {
      throw new Error('"_template" must be a non-null object.');
    }

    const processTemplate = (template, index = 0) => {
      if ('_repeat' in template) {
        const repeatCount = template._repeat;
        if (typeof repeatCount !== 'number' || repeatCount < 1) {
          throw new Error(`Invalid "_repeat" value. "_repeat" must be a positive number.`);
        }
        const { _repeat, ...restTemplate } = template;
        return Array.from({ length: repeatCount }, (_, i) => processTemplate(restTemplate, i));
      }

      const processedTemplate = {};
      for (const key in template) {
        if (typeof template[key] === 'object' && template[key] !== null) {
          processedTemplate[key] = processTemplate(template[key], index);
        } else {
          processedTemplate[key] = template[key];
        }
      }
      return generateData(processedTemplate, index);
    };

    const result = { [_key]: processTemplate(_template) };

    ensureDirectoryExists(dbDir);

    const filePath = `${dbDir}/${_key}.json`;
    writeToFile(filePath, result);

    return result;
  },
};

export const main = async () => {
  try {
    await runFactoryFiles();
    await removeExtraDbFiles();
    await mergeJsonFiles();
  } catch (err) {
    console.error(redText('Unexpected error:'), err);
    throw err;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
