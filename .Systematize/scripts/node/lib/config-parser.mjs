import { existsSync, readFileSync } from 'fs';

export function stripInlineComment(value) {
  let output = '';
  let quote = null;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if ((character === '"' || character === '\'') && value[index - 1] !== '\\') {
      quote = quote === character ? null : quote || character;
      output += character;
      continue;
    }

    if (character === '#' && !quote && (index === 0 || /\s/.test(value[index - 1]))) {
      break;
    }

    output += character;
  }

  return output.trim();
}

export function parseScalar(rawValue) {
  const value = stripInlineComment(rawValue);

  if (value === '') return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
    return value.slice(1, -1);
  }

  return value;
}

export function parseFlatYamlObject(content) {
  const config = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf(':');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    config[key] = parseScalar(rawValue);
  }

  return config;
}

export function readFlatYamlFile(filePath) {
  if (!existsSync(filePath)) return null;
  return parseFlatYamlObject(readFileSync(filePath, 'utf8'));
}

export function parseNestedYamlObject(content) {
  const result = {};
  const stack = [{ indent: -1, value: result }];

  for (const rawLine of content.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;

    const indent = rawLine.match(/^ */)[0].length;
    const line = rawLine.trim();
    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].value;

    if (rawValue === '') {
      parent[key] = {};
      stack.push({ indent, value: parent[key] });
    } else {
      parent[key] = parseScalar(rawValue);
    }
  }

  return result;
}
