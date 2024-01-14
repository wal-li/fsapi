import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DIRECTORY_MIME } from './constants.js';
import mime from 'mime';

export function getItemInfo(root, path) {
  path = join('/', path);
  const absPath = join(root, path);

  if (!existsSync(absPath)) return null;

  const stats = statSync(absPath);

  return {
    path,
    type: stats.isDirectory() ? DIRECTORY_MIME : mime.getType(path),
    size: stats.size,
    updatedAt: new Date(stats.ctime)
  };
}
