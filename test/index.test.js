import { Server } from '@wal-li/server';
import chai, { assert, expect } from 'chai';
import chaiHttp from 'chai-http';
import { createFsApi } from '../src/index.js';

chai.use(chaiHttp);

describe('Server test', function () {
  let server;

  before(async () => {
    server = new Server();

    server.use('/api', createFsApi({ root: './test/fixtures' }));

    await server.start();
  });

  after(async () => {
    await server.stop();
  });

  function makeRequest() {
    return chai.request(server.address);
  }

  it('should get root info', async () => {
    const res = await makeRequest().get('/api/');

    expect(res.body).to.has.property('path', '/');
    expect(res.body).to.has.property('type', 'inode/directory');
    expect(res.body).to.has.property('size', 0);
    expect(res).to.has.property('status', 200);
  });

  it('should get file info', async () => {
    const res = await makeRequest().get('/api/cat.png');

    expect(res.body).to.has.property('path', '/cat.png');
    expect(res.body).to.has.property('type', 'image/png');
    expect(res.body).to.has.property('size', 51024);
    expect(res).to.has.property('status', 200);
  });

  it('should get dir list', async () => {
    const res = await makeRequest().get('/api/?children');

    expect(res.body).to.has.property('length', 2);
    expect(res).to.has.property('status', 200);
  });

  it('should get file content', async () => {
    const res = await makeRequest().get('/api/cat.png?download').buffer();

    expect(res).to.has.property('status', 200);

    expect(res.headers).to.has.property('content-type', 'image/png');
    expect(res.headers).to.has.property('content-length', '51024');

    expect(
      res.body.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    ).to.be.eq(true);
  });
});
