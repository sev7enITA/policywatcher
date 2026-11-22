#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, cpSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
const root = resolve(import.meta.dirname, '..');
function fixture() {
  const folder = mkdtempSync(join(tmpdir(), 'pw-extension-origin-'));
  for (const name of ['browser-extension', 'src/lib', 'scripts']) mkdirSync(join(folder,name),{recursive:true});
  cpSync(join(root,'browser-extension'),join(folder,'browser-extension'),{recursive:true});
  cpSync(join(root,'src/lib/release.ts'),join(folder,'src/lib/release.ts'));
  for(const name of ['validate-browser-extension.mjs','package-browser-extension.sh'])cpSync(join(root,'scripts',name),join(folder,'scripts',name));
  return folder;
}
for(const url of ['https://policywatcher.online.evil.example/p','https://policywatcher.online@evil.example/p','https://user@policywatcher.online/p','http://policywatcher.online/p','https://www.policywatcher.online/p']){
 test('rejects unreviewed runtime origin '+url,()=>{
  const folder=fixture();try{
   const popup=join(folder,'browser-extension/popup.js');writeFileSync(popup,readFileSync(popup,'utf8')+`\nconst unreviewedOrigin = '${url}';\n`);
   const result=spawnSync(process.execPath,[join(folder,'scripts/validate-browser-extension.mjs')],{cwd:folder,encoding:'utf8'});
   assert.notEqual(result.status,0);assert.match(result.stderr,/unapproved network origin/);
  }finally{rmSync(folder,{recursive:true,force:true});}
 });
}
test('packages the canonical apex origin and emits only reviewed runtime resources',()=>{
 const folder=fixture();try{
  for(const args of [['init','-q'],['add','.'],['-c','user.name=Fixture QA','-c','user.email=fixture@example.invalid','commit','-qm','Fixture source']]){
   assert.equal(spawnSync('git',args,{cwd:folder,encoding:'utf8'}).status,0);
  }
  const output=join(folder,'out');const result=spawnSync('bash',['scripts/package-browser-extension.sh',output],{cwd:folder,encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+result.stderr);
  const packages=readdirSync(output).filter(f=>f.endsWith('.zip'));assert.equal(packages.length,3);
  for(const file of packages){
   const listing=spawnSync('zipinfo',['-1',join(output,file)],{encoding:'utf8'}).stdout;
   assert(!listing.includes('docs/'));assert(listing.includes('manifest.json'));assert(listing.includes('service-worker.js'));
  }
 }finally{rmSync(folder,{recursive:true,force:true});}
});
