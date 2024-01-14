import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { OutputFile, Router } from '@wal-li/server';
import { getItemInfo } from './handler.js';
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

  return router;
}
