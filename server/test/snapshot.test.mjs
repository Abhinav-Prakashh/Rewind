import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateSnapshot} from '../dist/services/snapshot.service.js';
import {allowedPath, safeText, MAX_FILE_BYTES, MAX_TOTAL_BYTES} from '../dist/services/snapshotPolicy.js';
const file = (path='src/app.ts', content='export const greeting = "hello";') => ({path,content,size:Buffer.byteLength(content),lastModified:1000});
const snapshot = files => ({name:'demo',files:files || [file()]});
test('client/server policy stays identical', () => assert.equal(readFileSync(new URL('../../client/src/lib/snapshotPolicy.ts',import.meta.url),'utf8'), readFileSync(new URL('../src/services/snapshotPolicy.ts',import.meta.url),'utf8')));
test('valid Unicode text and metadata round trip', () => assert.deepEqual(validateSnapshot(snapshot([file('src/app.ts','// café 👋')])), snapshot([file('src/app.ts','// café 👋')])));
test('reject traversal, absolute paths, dependencies, binaries, env and secrets', () => {
 for (const path of ['../a.ts','/a.ts','C:\\a.ts','src//a.ts','.git/config','node_modules/a.js','dist/a.js','build/a.js','coverage/a.json','src/.env','src/env.production.json','credentials.json','private-key.txt','secrets/a.ts','img.png','main.wasm','src/a.min.js','package-lock.json']) {
   assert.equal(allowedPath(path),false,path); assert.throws(() => validateSnapshot(snapshot([file(path)])),undefined,path);
 }
 assert.equal(allowedPath('src/auth/session.ts'),true);
});
test('reject binary contents, private keys and common embedded credentials', () => {
 for (const text of ['hello\0world','-----BEGIN RSA PRIVATE KEY-----','const api_key = "abcdefghijklmnopqrstuvwxyz"']) { assert.equal(safeText(text),false); assert.throws(() => validateSnapshot(snapshot([file('a.ts',text)]))); }
});
test('reject invalid metadata, duplicates, excessive files and bytes', () => {
 for(const body of [null,{},snapshot([]),snapshot([file(),file()]),snapshot([file('A.ts'),file('a.ts')]),snapshot([{...file(),size:1}]),snapshot([{...file(),lastModified:-1}]),snapshot([file('a.ts','a'.repeat(MAX_FILE_BYTES+1))]),snapshot(Array.from({length:1001},(_,i)=>file(`${i}.ts`))),snapshot(Array.from({length:17},(_,i)=>file(`${i}.ts`,'a'.repeat(MAX_TOTAL_BYTES/16))))]) assert.throws(()=>validateSnapshot(body));
});
