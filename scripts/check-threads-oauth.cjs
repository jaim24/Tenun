const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const calls = [];
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
  console.log('Threads OAuth request checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
