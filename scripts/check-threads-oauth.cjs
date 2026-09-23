const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const calls = [];
let failRequest = false;
let profileId = '28470027815972601';
const api = {};
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/lib/threads.ts'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, {
  exports: api,
  require: () => ({ getThreadsConfig: async () => ({
    clientId: 'test-id', clientSecret: 'test-secret', redirectUri: 'https://example.com/callback',
  }) }),
  URLSearchParams,
  fetch: async (url, options) => {
    calls.push({ url: new URL(url), options });
    if (failRequest) return { ok: false, status: 400, text: async () => JSON.stringify({ error: { message: 'Test OAuth failure', code: 190 } }) };
    if (new URL(url).pathname.endsWith('/me')) return { ok: true, text: async () => JSON.stringify({ id: profileId }) };
    return { ok: true, text: async () => JSON.stringify({ access_token: 'test-token', user_id: '123', expires_in: 5184000 }) };
  },
});

(async () => {
  await api.exchangeCode('test-code');
  assert.equal(calls[0].url.pathname, '/oauth/access_token');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.body.get('grant_type'), 'authorization_code');
  assert.equal(calls[0].options.body.get('code'), 'test-code');
  await api.exchangeForLongLivedToken('short-token');
  assert.equal(calls[1].url.pathname, '/access_token');
  assert.equal(calls[1].options.method ?? 'GET', 'GET');
  assert.equal(calls[1].url.searchParams.get('grant_type'), 'th_exchange_token');
  assert.equal(calls[1].url.searchParams.get('access_token'), 'short-token');
  assert.equal(calls[1].options.cache, 'no-store');
  const profile = await api.getMe('test-token');
  assert.equal(profile.id, '28470027815972601');
  profileId = Number(profileId);
  await assert.rejects(() => api.getMe('test-token'), error => error.code === 'PROFILE_ID');
  await api.publishContainer(profile.id, 'test-token', 'container-id');
  const publish = calls.at(-1);
  assert.equal(publish.url.pathname, '/v1.0/28470027815972601/threads_publish');
  assert.equal(publish.options.method, 'POST');
  assert.equal(publish.options.body.get('creation_id'), 'container-id');
  assert.equal(publish.options.body.get('access_token'), 'test-token');
  failRequest = true;
  for (const request of [() => api.exchangeCode('test-code'), () => api.exchangeForLongLivedToken('short-token')]) {
    await assert.rejects(request, error => {
      assert.equal(error.message, 'Test OAuth failure');
      assert.equal(error.code, '190');
      assert.equal(error.status, 400);
      return true;
    });
  }
  console.log('Threads OAuth request checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
