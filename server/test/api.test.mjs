import test from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test';
process.env.SUPABASE_URL='https://auth.invalid';
process.env.SUPABASE_ANON_KEY='test-public-key';
const {default:pool}=await import('../dist/db/database.js');
const {app}=await import('../dist/index.js');
const {GitService}=await import('../dist/services/git.service.js');
const id='11111111-1111-4111-8111-111111111111';
let failInsert=false, queries=[];
pool.query=async(sql,args=[]) => {
 queries.push(sql);
 if(sql.includes('user_id=$2')) return {rowCount:args[1]==='owner'?1:0,rows:args[1]==='owner'?[{id}]:[]};
 return {rowCount:1,rows:[]};
};
pool.connect=async()=>({release(){},async query(sql,args=[]){
 queries.push(sql);
 if(sql.includes('INSERT INTO repository_files') && failInsert) throw Error('simulated failure');
 if(sql.includes('count(*)')) return {rows:[{count:0}]};
 if(sql.includes('FOR UPDATE')) return {rowCount:args[1]==='owner'?1:0,rows:[{id}]};
 if(sql.includes('RETURNING *')) return {rows:[{id:args[1],source:'snapshot',name:args[0]}]};
 return {rows:[],rowCount:1};
}});
const realFetch=globalThis.fetch;
globalThis.fetch=(url,options) => String(url).startsWith('https://auth.invalid') ? Promise.resolve(new Response(JSON.stringify({id:options.headers.Authorization==='Bearer owner'?'owner':'other'}))) : realFetch(url,options);
const server=app.listen(0,'127.0.0.1');
await new Promise(resolve=>server.on('listening',resolve));
const base=`http://127.0.0.1:${server.address().port}/api`;
const body={name:'demo',files:[{path:'src/app.ts',content:'hello',size:5,lastModified:1000}]};
const call=(path,method='GET',value,token='owner')=>fetch(base+path,{method,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),'Content-Type':'application/json'},...(value!==undefined?{body:JSON.stringify(value)}:{})});
test('API auth, ownership, transactions, parser limits and production behavior',async()=>{
 try {
  assert.equal((await call('/health','GET',undefined,null)).status,200);
  assert.equal((await call('/repos/snapshots','POST',body,null)).status,401);
  for(const path of [`/repos/${id}/git/status`,`/repos/${id}/ai/query`,`/repos/${id}/sessions`,`/repos/${id}/activities`,`/repos/${id}/resume`,`/repos/${id}/timeline`,`/repos/${id}/decisions`,`/sessions/${id}/activities`,`/sessions/${id}/notes`,`/decisions/${id}`]) {
   assert.equal((await call(path,path.endsWith('query')?'POST':'GET',undefined,'other')).status,404,path);
  }
  assert.equal((await call(`/repos/${id}/snapshot`,'POST',body,'other')).status,404);
  queries=[];
  assert.equal((await call('/repos/snapshots','POST',body)).status,201);
  assert.ok(queries.includes('COMMIT'));
  assert.ok(queries.some(q=>q.includes('INSERT INTO repository_files')));
  assert.equal((await call(`/repos/${id}/snapshot`,'POST',body)).status,200);
  failInsert=true;queries=[];
  assert.equal((await call('/repos/snapshots','POST',body)).status,500);
  assert.ok(queries.includes('ROLLBACK'));assert.ok(!queries.includes('COMMIT'));failInsert=false;
  assert.equal((await call('/repos/snapshots','POST',{...body,files:[{...body.files[0],path:'../secret.ts'}]})).status,400);
  assert.equal((await call('/repos/snapshots','POST',{payload:'a'.repeat(6*1024*1024)})).status,413);
  const malformed=await fetch(base+'/repos/snapshots',{method:'POST',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:'{bad'});
  assert.equal(malformed.status,400);assert.match((await malformed.json()).error,/JSON/);
  const preflight=await fetch(base+'/repos/snapshots',{method:'OPTIONS',headers:{Origin:'https://rewind-silk.vercel.app','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});
  assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'https://rewind-silk.vercel.app');
  process.env.NODE_ENV='production';
  assert.equal((await call('/repos','POST',{path:'/Users/missing'})).status,400);
  assert.equal((await call('/repos/browse','POST')).status,400);
  for(const path of ['snapshot:'+id,'/Users/does-not-exist']) {
   const git=new GitService(path);assert.deepEqual(await git.getRecentCommits(),[]);assert.deepEqual(await git.getStatus(),{branch:path.startsWith('snapshot:')?'Snapshot':'Unavailable',changedFiles:[],ahead:0,behind:0});
  }
 } finally {await new Promise(resolve=>server.close(resolve));globalThis.fetch=realFetch;await pool.end();}
});
