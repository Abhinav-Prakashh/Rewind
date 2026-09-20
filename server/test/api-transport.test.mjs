import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../../client/src/lib/apiTransport.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {resolveApiBase,apiRequest}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('deployed Render origin, /api URL, slash and whitespace resolve to one API prefix',()=>{
 for(const value of ['https://rewind-api-7k4y.onrender.com','https://rewind-api-7k4y.onrender.com/','https://rewind-api-7k4y.onrender.com/api','  https://rewind-api-7k4y.onrender.com/api///  ']) assert.equal(resolveApiBase(value,false),'https://rewind-api-7k4y.onrender.com/api');
 assert.equal(resolveApiBase(undefined,true),'http://localhost:3001/api');
 assert.equal(resolveApiBase('',false),'');
});
test('upload includes auth and contents, preserves API errors, identifies HTML/HTTP/network failures, accepts null sessions',async()=>{
 const realFetch=globalThis.fetch;
 try{
  globalThis.fetch=async(url,options)=>{
   assert.equal(url,'https://rewind-api-7k4y.onrender.com/api/repos/snapshots');
   assert.equal(options.headers.get('Authorization'),'Bearer session-token');
   assert.equal(options.method,'POST');assert.equal(JSON.parse(options.body).files[0].path,'src/app.ts');
   return Response.json({id:'created',source:'snapshot'},{status:201});
  };
  assert.equal((await apiRequest(resolveApiBase('https://rewind-api-7k4y.onrender.com/',false),'/repos/snapshots','session-token',{method:'POST',body:JSON.stringify({name:'demo',files:[{path:'src/app.ts',content:'hello'}]})})).id,'created');
  for(const [response,message] of [
    [new Response('<html>Cannot POST /repos/snapshots</html>',{status:404}),/endpoint was not found.*404/],
    [new Response('<html>Gateway error</html>',{status:502}),/HTTP 502/],
    [new Response('<html>App page</html>',{headers:{'Content-Type':'text/html'}}),/web page instead/],
    [new Response('large',{status:413}),/too large/],
    [Response.json({error:'Invalid snapshot'},{status:400}),/Invalid snapshot/]
  ]){
   globalThis.fetch=async()=>response;
   await assert.rejects(apiRequest('https://api.example/api','/repos/snapshots','token'),message);
  }
  globalThis.fetch=async()=>Response.json(null);
  assert.equal(await apiRequest('https://api.example/api','/sessions/active','token'),null);
  globalThis.fetch=async()=>{throw new TypeError('Failed to fetch');};
  await assert.rejects(apiRequest('https://api.example/api','/repos','token'),/Unable to reach/);
  await assert.rejects(apiRequest('https://api.example/api','/repos',null),/session has expired/);
 }finally{globalThis.fetch=realFetch;}
});
