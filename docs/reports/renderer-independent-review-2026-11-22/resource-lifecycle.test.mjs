import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { request } from 'node:http';

process.env.RENDERER_SECRET = 'SYNTHETIC_INDEPENDENT_LOCAL_SECRET_32';
process.env.RENDERER_ALLOWED_DOMAINS = 'example.com';
process.env.MAX_CONCURRENCY = '1';
const auth = { authorization: 'Bearer SYNTHETIC_INDEPENDENT_LOCAL_SECRET_32', 'content-type': 'application/json' };
let contextFactory, dnsLookup = async () => [{ address: '93.184.216.34', family: 4 }];
globalThis.__reviewChromium = { launch: async () => ({ on() {}, isConnected: () => true, version: () => '149.0.0.0', newContext: (...args) => contextFactory(...args) }) };
globalThis.__reviewLookup = (...args) => dnsLookup(...args);
registerHooks({
 resolve(name, context, next) { if (name === 'playwright' || name === 'dns/promises') return { url: 'independent:' + name, shortCircuit: true }; return next(name, context); },
 load(url, context, next) {
  if (url === 'independent:playwright') return { format: 'module', source: 'export const chromium = globalThis.__reviewChromium', shortCircuit: true };
  if (url === 'independent:dns/promises') return { format: 'module', source: 'export const lookup = (...args) => globalThis.__reviewLookup(...args)', shortCircuit: true };
  return next(url, context);
 }
});
const sourceUrl = process.env.POLICYWATCHER_RENDERER_REVIEW_SOURCE
 ? pathToFileURL(resolve(process.env.POLICYWATCHER_RENDERER_REVIEW_SOURCE))
 : new URL('../../../renderer/server.mjs', import.meta.url);
sourceUrl.searchParams.set('independent', 'lifecycle');
const { createRendererServer } = await import(sourceUrl.href);
function deferred() { let resolve, reject; const promise = new Promise((a,b) => { resolve=a;reject=b; }); return { promise,resolve,reject }; }
async function setup(t) {
 const server = createRendererServer({ capacity: 1 }); await new Promise(r => server.listen(0,'127.0.0.1',r));
 t.after(async () => { server.closeAllConnections(); await new Promise(r => server.close(r)); });
 const origin='http://127.0.0.1:'+server.address().port;
 const ready=async () => (await fetch(origin+'/readyz',{headers:auth})).json();
 const post=async () => fetch(origin+'/render',{method:'POST',headers:auth,body:JSON.stringify({url:'https://example.com/policy'})});
 return { origin,ready,post };
}
async function idle(ready) { for(let i=0;i<40;i++){ const state=await ready();assert(state.active>=0);if(state.active===0)return;await new Promise(r=>setTimeout(r,5)); }assert.fail('Reservation did not reach zero'); }
function pageFixture(overrides={}) { let url=''; return { route:async()=>{},goto:async u=>{url=u;return{status:()=>200}},waitForLoadState:async()=>{},waitForTimeout:async()=>{},url:()=>url,content:async()=>'<html><body>synthetic document only</body></html>',close:async()=>{},...overrides }; }

test('actual default render retains its slot until context.close resolves',async t=>{
 const closeEntered=deferred(),closeRelease=deferred();let closed=false;
 t.after(()=>closeRelease.resolve());
 contextFactory=async()=>({newPage:async()=>pageFixture(),close:async()=>{closeEntered.resolve();await closeRelease.promise;closed=true;}});
 const {ready,post}=await setup(t);const first=post();await closeEntered.promise;
 assert.equal(closed,false);assert.equal((await ready()).active,1);assert.equal((await post()).status,429);
 closeRelease.resolve();assert.equal((await first).status,200);assert.equal(closed,true);await idle(ready);
 for(let i=0;i<3;i++){assert.equal((await post()).status,200);await idle(ready);}
});

test('actual default render abort closes its context but retains admission until cleanup settles',async t=>{
 const navEntered=deferred(),navigation=deferred(),closeEntered=deferred(),closeRelease=deferred();let closeCalls=0;
 t.after(()=>{navigation.reject(Error('cleanup'));closeRelease.resolve();});
 contextFactory=async()=>({newPage:async()=>pageFixture({goto:async()=>{navEntered.resolve();return navigation.promise;}}),close:async()=>{closeCalls++;closeEntered.resolve();navigation.reject(Error('synthetic_closed_context'));await closeRelease.promise;}});
 const {origin,ready,post}=await setup(t);const req=request(origin+'/render',{method:'POST',headers:auth});req.on('error',()=>{});req.end(JSON.stringify({url:'https://example.com/policy'}));
 await navEntered.promise;req.destroy();await closeEntered.promise;
 assert.equal((await ready()).active,1);assert.equal((await post()).status,429);assert(closeCalls>=1);
 closeRelease.resolve();await idle(ready);
});

test('disconnect during the actual default DNS validator cannot start a browser context later',async t=>{
 const entered=deferred(),lookupRelease=deferred();let contexts=0;
 dnsLookup=async()=>{entered.resolve();return lookupRelease.promise;};
 t.after(()=>{lookupRelease.resolve([{address:'93.184.216.34',family:4}]);dnsLookup=async()=>[{address:'93.184.216.34',family:4}];});
 contextFactory=async()=>{contexts++;throw Error('Context must not start after disconnect');};
 const {origin,ready,post}=await setup(t);const req=request(origin+'/render',{method:'POST',headers:auth});req.on('error',()=>{});req.end(JSON.stringify({url:'https://example.com/policy'}));
 await entered.promise;req.destroy();await new Promise(r=>setTimeout(r,15));
 assert.equal((await ready()).active,1);assert.equal((await post()).status,429);
 lookupRelease.resolve([{address:'93.184.216.34',family:4}]);await idle(ready);assert.equal(contexts,0);
});
