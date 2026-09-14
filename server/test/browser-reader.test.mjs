import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const dataURL=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const compile=path=>ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const policy=dataURL(compile('../../client/src/lib/snapshotPolicy.ts'));
const reader=compile('../../client/src/lib/snapshot.ts').replace("'./snapshotPolicy'",JSON.stringify(policy));
const {readSnapshot}=await import(dataURL(reader));
const entry=(name,content)=>({name,kind:'file',getFile:async()=>new File([content],name,{lastModified:1000})});
const directory=(name,entries)=>({name,kind:'directory',async *values(){yield* entries;}});
test('browser reader prunes excluded directories without reading contents',async()=>{
 const forbidden=directory('.git',[]);forbidden.values=()=>{throw Error('must not read git');};
 const source=directory('demo',[forbidden,directory('src',[entry('a.ts','const n = 1;')]),entry('.env','do not upload'),entry('image.png','binary'),entry('bad.ts',new Uint8Array([255,254,0]))]);
 const result=await readSnapshot(source);
 assert.equal(result.snapshot.name,'demo');assert.deepEqual(result.snapshot.files.map(f=>f.path),['src/a.ts']);assert.equal(result.skipped,4);
});
test('fallback file list preserves only relative paths and Unicode byte metadata',async()=>{
 const file=new File(['// 👋'],'app.ts',{lastModified:123});Object.defineProperty(file,'webkitRelativePath',{value:'demo/src/app.ts'});
 const result=await readSnapshot([file]);assert.equal(result.snapshot.files[0].path,'src/app.ts');assert.equal(result.snapshot.files[0].size,7);assert.equal(result.snapshot.files[0].lastModified,123);
});
test('empty, unreadable, oversized selection is recoverable before any upload',async()=>{
 await assert.rejects(readSnapshot(directory('empty',[])),/No eligible/);
 await assert.rejects(readSnapshot(directory('bad',[{name:'a.ts',kind:'file',getFile:async()=>{throw Error('permission revoked');}}])),/permission/);
 await assert.rejects(readSnapshot(directory('large',Array.from({length:1001},(_,i)=>entry(`${i}.ts`,'x')))),/exceeds/);
});
