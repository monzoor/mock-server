export const processTemplate = (tmpl, index) => {
  if (Array.isArray(tmpl)) {
    return tmpl.flatMap((entry) => {
      if (entry && typeof entry === 'object' && '_repeat' in entry) {
        const repeatCount = entry._repeat;
        if (typeof repeatCount !== 'number' || repeatCount < 1) {
          throw new Error(`Invalid "_repeat" value in array. "_repeat" must be a positive number.`);
        }
        return Array.from({ length: repeatCount }, () => {
          const { _repeat, ...rest } = entry;
          return processTemplate(rest, index);
        });
      }
      return processTemplate(entry, index);
    });
  } else if (tmpl && typeof tmpl === 'object') {
    const result = {};
    for (const key in tmpl) {
      if (key === '_repeat') continue;
      result[key] = processTemplate(tmpl[key], index);
    }
    return result;
  } else if (typeof tmpl === 'function') {
    return tmpl(index);
  }
  return tmpl;
};

export const generateData = (_template, index) => {
  const item = processTemplate(_template, index);
  return { id: index + 1, ...item };
};
