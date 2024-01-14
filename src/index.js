import {
  closeSync,
  cpSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { dirname, join } from 'node:path';
import { OutputFile, Router } from '@wal-li/server';
import { getField, getItemInfo } from './handler.js';
import { DIRECTORY_MIME } from './constants.js';

export function createFsApi(config = {}) {
  const root = config.root;
  if (!root) throw new Error(`Must have root`);

  const router = new Router();

  router.get('/:path(.*)', ({ params: { path }, query }) => {
    const item = getItemInfo(root, path);

    // not found
    if (!item) return null;

    // children
    if (Object.hasOwn(query, 'children')) {
      return {
        status: 200,
        body:
          item.type === DIRECTORY_MIME
            ? readdirSync(join(root, item.path)).map((name) =>
                getItemInfo(root, join(item.path, name))
              )
            : []
      };
    }

    // detail
    if (Object.hasOwn(query, 'download')) {
      if (item.type === DIRECTORY_MIME) return null;

      return {
        status: 200,
        body: new OutputFile(join(root, item.path))
      };
    }

    // info
    return {
      status: 200,
      body: item
    };
  });

  router.post('/:path(.*)', ({ params: { path }, fields, files }) => {
    const absPath = join(root, join('/', path));

    if (existsSync(absPath))
      return {
        status: 400,
        body: 'Item Exists'
      };

    if (getField(fields, 'type') === DIRECTORY_MIME) {
      mkdirSync(absPath, { recursive: true });
    } else {
      const absParentDir = dirname(absPath);
      mkdirSync(absParentDir, { recursive: true });

      const content = getField(fields, 'content') || getField(files, 'content');

      if (content && content.constructor.name === 'PersistentFile') {
        cpSync(content.filepath, absPath);
      } else if (content) {
        writeFileSync(absPath, content);
      } else {
        closeSync(openSync(absPath, 'w'));
      }
    }

    const item = getItemInfo(root, path);

    return {
      status: 200,
      body: item
    };
  });

  router.delete('/:path(.*)', ({ params: { path } }) => {
    const absPath = join(root, join('/', path));
    const item = getItemInfo(root, path);

    // not found
    if (!item) return null;

    // remove
    rmSync(absPath, { recursive: true });

    return {
      status: 200,
      body: item
    };
  });

  router.patch('/:path(.*)', ({ params: { path }, fields, files }) => {
    let absPath = join(root, join('/', path));

    // not found
    if (!existsSync(absPath)) return null;

    const nextPath = getField(fields, 'path');
    if (nextPath) {
      const nextAbsPath = join(root, join('/', nextPath));
      if (!existsSync(dirname(nextAbsPath))) mkdirSync(dirname(nextAbsPath));
      renameSync(absPath, nextAbsPath);
      path = nextPath;
    }

    const content = getField(fields, 'content') || getField(files, 'content');
    absPath = join(root, join('/', path));

    if (content && content.constructor.name === 'PersistentFile') {
      rmSync(absPath, { recursive: true });
      cpSync(content.filepath, absPath);
    } else if (content) {
      writeFileSync(absPath, content);
    }

    return {
      status: 200,
      body: getItemInfo(root, path)
    };
  });

  return router;
}
