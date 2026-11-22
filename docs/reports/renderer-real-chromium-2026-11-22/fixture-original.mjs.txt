import { Server, request } from 'node:http';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const output=resolve('output/renderer-1.2.1/real-chromium/receipt.json');
const receipt={startedAt:new Date().toISOString(),scope:'Real installed Playwright Chromium on this Mac; real candidate1.2.1 HTTP handler, DNS and browser render. Only listener binding forced to127.0.0.1 ephemeral port. One intended external top-level request to IANA example.com; no PolicyWatcher, database, model or VPS endpoint.',remoteVpsQualification:false,modelCalls:0,policySourceCalls:0,downloadOrInstall:false};
let resolveListen;const listening=new Promise(r=>resolveListen=r);let service;
const listen=Server.prototype.listen;
Server.prototype.listen=function(_port,callback){Server.prototype.listen=listen;service=this;return listen.call(this,0,'127.0.0.1',()=>{callback?.();resolveListen()})};
process.env.RENDERER_SECRET='SYNTHETIC_LOCAL_REAL_BROWSER_TEST_ONLY';
process.env.RENDERER_ALLOWED_DOMAINS='example.com';process.env.MAX_CONCURRENCY='1';process.env.RENDERER_ALLOW_HTTP='false';
delete process.env.RENDERER_SECRET_PREVIOUS;delete process.env.RENDERER_SUBRESOURCE_ALLOWED_DOMAINS;delete process.env.RENDER_USER_AGENT;
process.argv[1]=resolve('renderer/server.mjs');
let slow;
try{
await import(pathToFileURL(process.argv[1]));await listening;
const origin='http://127.0.0.1:'+service.address().port;
const headers={Authorization:'Bearer SYNTHETIC_LOCAL_REAL_BROWSER_TEST_ONLY','Content-Type':'application/json'};
const readyResponse=await fetch(origin+'/readyz',{headers,signal:AbortSignal.timeout(45000)});receipt.initialReady={status:readyResponse.status,payload:await readyResponse.json()};assert.equal(readyResponse.status,200);
const completed=new Promise((resolveResponse,reject)=>{slow=request(origin+'/render',{method:'POST',headers},response=>{const chunks=[];response.on('data',c=>chunks.push(c));response.on('end',()=>resolveResponse({status:response.statusCode,payload:JSON.parse(Buffer.concat(chunks).toString())}));});slow.on('error',reject);slow.write('{"url":');});
for(let i=0;i<20;i++){const payload=await fetch(origin+'/readyz',{headers}).then(r=>r.json());if(payload.active===1){receipt.partialBodyActive=payload.active;break;}await new Promise(r=>setTimeout(r,5));}
assert.equal(receipt.partialBodyActive,1);
const busy=await fetch(origin+'/render',{method:'POST',headers,body:JSON.stringify({url:'https://example.com'}),signal:AbortSignal.timeout(5000)});receipt.concurrentAttempt={status:busy.status,retryAfter:busy.headers.get('retry-after'),payload:await busy.json()};assert.equal(busy.status,429);
slow.end('"https://example.com"}');
const result=await Promise.race([completed,new Promise((_,reject)=>setTimeout(()=>reject(Error('bounded_external_probe_timeout')),110000))]);
receipt.externalRender={outerStatus:result.status,sourceStatus:result.payload.status??null,finalUrl:result.payload.finalUrl??null,htmlBytes:typeof result.payload.html==='string'?Buffer.byteLength(result.payload.html):0,exampleDomainObserved:typeof result.payload.html==='string'&&result.payload.html.includes('Example Domain'),error:result.payload.error??null};
const after=await fetch(origin+'/readyz',{headers}).then(r=>r.json());receipt.finalReady=after;assert.equal(after.active,0);
assert.equal(result.status,200);assert.equal(result.payload.status,200);assert.equal(new URL(result.payload.finalUrl).hostname,'example.com');assert.equal(receipt.externalRender.exampleDomainObserved,true);
receipt.status='passed_real_local_browser_and_admission';
}catch(error){receipt.status='failed_or_unavailable';receipt.failure=error.message;process.exitCode=1;slow?.destroy();}
finally{
receipt.completedAt=new Date().toISOString();await writeFile(output,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
// The actual main-module SIGTERM handler closes the shared real browser and server.
process.kill(process.pid,'SIGTERM');
}
