#!/usr/bin/env node
// Executes the actual packaged worker against a stub browser/network boundary; this is not Safari execution.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { test } from 'node:test';
const argument = process.argv.indexOf('--runtime-dir');
const runtime = resolve(argument >= 0 ? process.argv[argument + 1] : 'browser-extension');
const source = readFileSync(resolve(runtime, 'service-worker.js'), 'utf8');
const manifest = JSON.parse(readFileSync(resolve(runtime, 'manifest.json'), 'utf8'));
function environment(status = 200, shouldThrow = false) {
  let listener;
  const requests = [];
  const context = vm.createContext({AbortController, setTimeout, clearTimeout,
    chrome: {runtime: {id: 'policywatcher-test', onMessage: {addListener: fn => {listener = fn;}}}},
    fetch: async (url, options) => {
      requests.push({url,options});
      if (shouldThrow) throw Error('synthetic offline');
      return {ok: status === 200, status, json: async () => ({state:'queued', reference:'SYNTHETIC-ONLY'})};
    },
  });
  vm.runInContext(source, context);
  return {requests, listener};
}
const clues = {companyName:'Example organization',senderDomain:'example.invalid',sourceUrl:'https://example.invalid/privacy',noticeDate:'2026-11-22',effectiveDate:'2026-12-01',policyTypes:['privacy'],lang:'en',honeypot:''};
function invoke(env, payload) {
  return new Promise(resolveResult => {assert.equal(env.listener({type:'POLICYWATCHER_QUERY',payload},{id:'policywatcher-test'},resolveResult),true);});
}
test('packaged Safari manifest keeps temporary access and only the reviewed API origin',()=>{
  assert.equal(manifest.manifest_version,3);
  assert.deepEqual(manifest.permissions,['activeTab','scripting']);
  assert.deepEqual(manifest.host_permissions,['https://policywatcher.online/*']);
  assert.equal(manifest.background.service_worker,'service-worker.js');
  assert(!manifest.permissions.includes('nativeMessaging'));
});
test('rejects foreign senders and unrelated message types without fetch',()=>{
 const env=environment();assert.equal(env.listener({type:'POLICYWATCHER_QUERY',payload:clues},{id:'other-extension'},()=>assert.fail('reply')),false);
 assert.equal(env.listener({type:'OTHER',payload:clues},{id:'policywatcher-test'},()=>assert.fail('reply')),false);assert.equal(env.requests.length,0);
});
test('serializes the confirmed dictionary to the fixed endpoint without credentials or redirects',async()=>{
 const env=environment();const response=await invoke(env,clues);assert.equal(response.status,200);assert.equal(env.requests.length,1);
 const {url,options}=env.requests[0];assert.equal(url,'https://policywatcher.online/api/policy-inquiries');assert.equal(options.method,'POST');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');assert.deepEqual(JSON.parse(options.body),clues);
});
test('rejects raw-content and unexpected JSON fields before the network boundary',async()=>{
 const env=environment();const response=await invoke(env,{...clues,rawText:'SYNTHETIC_PRIVATE_SENTINEL'});assert.equal(response.networkError,true);assert.equal(env.requests.length,0);
});
test('returns rate-limit and service-unavailable codes instead of a fabricated success',async()=>{
 for(const status of [429,503]){const env=environment(status);const response=await invoke(env,clues);assert.equal(response.ok,false);assert.equal(response.status,status);}
});
test('returns an explicit offline result when transport throws',async()=>{
 const env=environment(200,true);const response=await invoke(env,clues);assert.equal(response.networkError,true);assert.equal(response.ok,false);assert.equal(response.status,0);
});
