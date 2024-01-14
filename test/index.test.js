import { Server } from '@wal-li/server';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { createFsApi } from '../src/index.js';

chai.use(chaiHttp);

const RANDOM_TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

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
    expect(res).to.has.property('status', 200);
  });

  it('should get file info', async () => {
    const res = await makeRequest().get('/api/cat.png');

    expect(res.body).to.has.property('path', '/cat.png');
    expect(res.body).to.has.property('type', 'image/png');
    expect(res.body).to.has.property('size', 51024);
    expect(res).to.has.property('status', 200);
  });

  it('should try to remove tmp dir', async () => {
    await makeRequest().delete('/api/tmp');
  });

  it('should create an empty file', async () => {
    const res = await makeRequest().post('/api/tmp/create/hello.txt');

    expect(res.body).to.has.property('path', '/tmp/create/hello.txt');
    expect(res.body).to.has.property('type', 'text/plain');
    expect(res).to.has.property('status', 200);
  });

  it('should create a content file', async () => {
    const res = await makeRequest()
      .post('/api/tmp/create/json.txt')
      .send({ content: RANDOM_TEXT });

    expect(res.body).to.has.property('path', '/tmp/create/json.txt');
    expect(res.body).to.has.property('type', 'text/plain');
    expect(res.body).to.has.property('size', RANDOM_TEXT.length);
    expect(res).to.has.property('status', 200);

    const res2 = await makeRequest()
      .post('/api/tmp/create/formdata.txt')
      .field('content', RANDOM_TEXT);

    expect(res2.body).to.has.property('path', '/tmp/create/formdata.txt');
    expect(res2.body).to.has.property('type', 'text/plain');
    expect(res2.body).to.has.property('size', RANDOM_TEXT.length);
    expect(res2).to.has.property('status', 200);

    const res3 = await makeRequest()
      .post('/api/tmp/create/file.txt')
      .attach('content', './test/fixtures/tmp/create/json.txt');

    expect(res3.body).to.has.property('path', '/tmp/create/file.txt');
    expect(res3.body).to.has.property('type', 'text/plain');
    expect(res3.body).to.has.property('size', RANDOM_TEXT.length);
    expect(res3).to.has.property('status', 200);
  });

  it('should not create exists file', async () => {
    const res = await makeRequest()
      .post('/api/tmp/create/json.txt')
      .send({ content: RANDOM_TEXT });

    expect(res).to.has.property('text', 'Item Exists');
    expect(res).to.has.property('status', 400);
  });

  it('should create a directory', async () => {
    const res = await makeRequest()
      .post('/api/tmp/create/dir')
      .send(`type=inode/directory`);

    expect(res.body).to.has.property('path', '/tmp/create/dir');
    expect(res.body).to.has.property('type', 'inode/directory');
    expect(res).to.has.property('status', 200);
  });

  it('should modify file', async () => {
    const res = await makeRequest()
      .patch('/api/tmp/create/json.txt')
      .send(`path=/tmp/modify/next.html`);

    expect(res.body).to.has.property('path', '/tmp/modify/next.html');
    expect(res.body).to.has.property('type', 'text/html');
    expect(res.body).to.has.property('size', 56);
    expect(res).to.has.property('status', 200);

    const res2 = await makeRequest()
      .patch('/api/tmp/create/hello.txt')
      .field('path', '/tmp/modify/hi.json')
      .attach('content', './package.json');

    expect(res2.body).to.has.property('path', '/tmp/modify/hi.json');
    expect(res2.body).to.has.property('type', 'application/json');
    expect(res2).to.has.property('status', 200);

    const res3 = await makeRequest()
      .patch('/api/tmp/modify/hi.json')
      .send('content=hello, world');

    expect(res3.body).to.has.property('path', '/tmp/modify/hi.json');
    expect(res3.body).to.has.property('type', 'application/json');
    expect(res3).to.has.property('status', 200);
  });

  it('should get dir list', async () => {
    const res = await makeRequest().get('/api/?children');

    expect(res.body).to.has.property('length', 3);
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

  it('should remove tmp dir', async () => {
    const res = await makeRequest().delete('/api/tmp');

    expect(res.body).to.has.property('path', '/tmp');
    expect(res).to.has.property('status', 200);
  });
});
