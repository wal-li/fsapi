# Walli FS API

## Usage

```js
import { createServer } from '@wal-li/server';
import { createFsApi } from '@wal-li/fsapi';

const server = createServer();

server.use('/base/api', createFsApi(config));
```

## Config

- `root`: Root directory to serve.

## License

MIT.
