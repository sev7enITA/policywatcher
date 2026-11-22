import { execFileSync } from 'node:child_process';
import { registerHooks } from 'node:module';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
// Developer-only negative control. Node22.15+; DNS/browser stubbed and listener forced to loopback.
const root=process.cwd();await mkdir(resolve(root,'output/renderer-1.2.1'),{recursive:true});const sourceRef=process.env.POLICYWATCHER_RENDERER_SOURCE_REF;const recovery=process.argv.includes('--recovery');const sourcePath=resolve(root,'renderer/server.mjs');
const sourceOverride=sourceRef?execFileSync('git',['show',sourceRef+':renderer/server.mjs'],{cwd:root,encoding:'utf8'}):null;let server;let resolveListen;const listening=new Promise(r=>resolveListen=r);
let lookupCount=0;let releaseLookups;const lookupGate=new Promise(r=>releaseLookups=r);
let launches=0;globalThis.__qaLaunch=async()=>{launches++;if(recovery&&launches===1)throw Error('synthetic_initial_launch_failure');return globalThis.__qaBrowser};
let contexts=0;let releaseRender;const renderGate=new Promise(r=>releaseRender=r);
globalThis.__qaLookup=async()=>{lookupCount++;await lookupGate;return[{address:'93.184.216.34',family:4}]};
globalThis.__qaBrowser={isConnected:()=>true,version:()=> '149.0.0.0',on:()=>{},close:async()=>{},newContext:async()=>{contexts++;return{close:async()=>{},newPage:async()=>{let current='';return{route:async()=>{},goto:async(url)=>{current=url;await renderGate;return{status:()=>200}},waitForLoadState:async()=>{},waitForTimeout:async()=>{},url:()=>current,content:async()=>'<html><body>synthetic policy only</body></html>',close:async()=>{}}}}}};
globalThis.__qaCreateServer=(...args)=>{server=createServer(...args);const listen=server.listen.bind(server);server.listen=(_port,callback)=>listen(0,'127.0.0.1',()=>{callback?.();resolveListen()});return server;};
registerHooks({resolve(specifier,context,next){if(['http','dns/promises','playwright'].includes(specifier))return{url:'fixture:'+specifier,shortCircuit:true};return next(specifier,context)},load(url,context,next){if(sourceOverride&&url===pathToFileURL(sourcePath).href)return{format:'module',source:sourceOverride,shortCircuit:true};if(url==='fixture:http')return{format:'module',source:'export const createServer=(...args)=>globalThis.__qaCreateServer(...args)',shortCircuit:true};if(url==='fixture:dns/promises')return{format:'module',source:'export const lookup=(...args)=>globalThis.__qaLookup(...args)',shortCircuit:true};if(url==='fixture:playwright')return{format:'module',source:'export const chromium={launch:async()=>globalThis.__qaLaunch()}',shortCircuit:true};return next(url,context)}});
process.env.RENDERER_SECRET='SYNTHETIC_LOCAL_ONLY_32_CHARACTERS';process.env.RENDERER_ALLOWED_DOMAINS='example.com';process.env.MAX_CONCURRENCY='1';
process.argv[1]=sourcePath;
await import(pathToFileURL(process.argv[1]));await listening;
const origin='http://127.0.0.1:'+server.address().port;
const headers={'Authorization':'Bearer SYNTHETIC_LOCAL_ONLY_32_CHARACTERS','Content-Type':'application/json'};
const results={scope:'Real renderer HTTP admission flow; DNS and Chromium stubbed, listener forced onto isolated loopback ephemeral port; no external target request.'};
results.sourceRef=sourceRef||'working-tree-candidate';
let requests=[];
try{
 if(recovery){
  results.readiness=[];
  for(let i=0;i<2;i++){const response=await fetch(origin+'/readyz',{headers});results.readiness.push({status:response.status,payload:await response.json()});}
  results.launchAttempts=launches;
  results.recovered=results.readiness[0].status===503&&results.readiness[1].status===200&&launches===2;
  assert.equal(results.recovered,true,'A failed browser launch must permit a fresh recovery attempt.');
 }else{
  requests=[fetch(origin+'/render',{method:'POST',headers,body:JSON.stringify({url:'https://example.com/policy-one'})}),fetch(origin+'/render',{method:'POST',headers,body:JSON.stringify({url:'https://example.com/policy-two'})})];
  const expected=sourceRef?2:1;
  for(let i=0;i<100&&lookupCount<expected;i++)await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(lookupCount,expected,'Requests did not reach the controlled DNS gate.');
  releaseLookups();
  for(let i=0;i<100&&contexts<expected;i++)await new Promise(resolve=>setTimeout(resolve,5));
  const ready=await fetch(origin+'/readyz',{headers}).then(r=>r.json());
  results.capacity=ready.capacity;results.active=ready.active;results.startedContexts=contexts;
  releaseRender();results.responses=await Promise.all(requests.map(async promise=>{const response=await promise;await response.text();return response.status}));
  assert.equal(results.active<=results.capacity,true,'Active reservations must not exceed capacity.');
  assert.deepEqual([...results.responses].sort(),[200,429]);
 }
}finally{
 releaseLookups();releaseRender();await Promise.allSettled(requests);await new Promise(resolve=>server.close(resolve));
 const output=resolve(root,'output/renderer-1.2.1');
 await writeFile(resolve(output,(sourceRef?'parent-':'fixed-')+(recovery?'recovery':'admission')+'.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
}
