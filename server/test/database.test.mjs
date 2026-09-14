import test from 'node:test';
import assert from 'node:assert/strict';
// Opt in only against an empty disposable database; never use DATABASE_URL implicitly.
test('PostgreSQL snapshot lifecycle, index, isolation and rollback', {skip:!process.env.TEST_DATABASE_URL}, async()=>{
 process.env.NODE_ENV='test';process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;process.env.DATABASE_SSL='false';
 process.env.SUPABASE_URL='https://auth.invalid';process.env.SUPABASE_ANON_KEY='test-key';
 delete process.env.GEMINI_API_KEY;delete process.env.OPENAI_API_KEY;
 const {default:pool,initializeDatabase}=await import('../dist/db/database.js');
 const {app}=await import('../dist/index.js');
 await initializeDatabase();await initializeDatabase();
 const realFetch=globalThis.fetch;
 globalThis.fetch=(url,options)=>String(url).startsWith('https://auth.invalid')?Promise.resolve(new Response(JSON.stringify({id:options.headers.Authorization==='Bearer owner'?'owner':'other'}))):realFetch(url,options);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const base=`http://127.0.0.1:${server.address().port}/api`;
 const call=(path,method='GET',body,token='owner')=>fetch(base+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const file=(path,content)=>({path,content,size:Buffer.byteLength(content),lastModified:1});
 try{
  const upload=await call('/repos/snapshots','POST',{name:'demo',files:[file('src/auth.ts','export const authentication = true;'),file('old.md','old')]});
  assert.equal(upload.status,201);const repo=await upload.json();
  assert.equal((await call('/repos/'+repo.id)).status,200);
  assert.equal((await call('/repos/'+repo.id,'GET',undefined,'other')).status,404);
  for(const suffix of ['/git/status','/resume','/timeline','/activities']) assert.equal((await call('/repos/'+repo.id+suffix)).status,200,suffix);
  const sessionResponse=await call(`/repos/${repo.id}/sessions`,'POST',{});assert.equal(sessionResponse.status,201);const session=await sessionResponse.json();
  const replace=await call(`/repos/${repo.id}/snapshot`,'POST',{name:'demo',files:[file('src/auth.ts','export const authentication = false;')]});assert.equal(replace.status,200);
  assert.deepEqual((await pool.query('SELECT path FROM repository_files WHERE repo_id=$1',[repo.id])).rows.map(f=>f.path),['src/auth.ts']);
  const activities=(await pool.query('SELECT type FROM activities WHERE session_id=$1',[session.id])).rows.map(a=>a.type).sort();assert.deepEqual(activities,['file_deleted','file_modified']);
  const answer=await call(`/repos/${repo.id}/ai/query`,'POST',{query:'authentication'});assert.equal(answer.status,200);assert.ok((await answer.json()).sources.some(s=>s.label==='src/auth.ts'));
  await pool.query("CREATE FUNCTION reject_snapshot_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$; CREATE TRIGGER reject_snapshot_test BEFORE INSERT ON repository_files FOR EACH ROW EXECUTE FUNCTION reject_snapshot_test();");
  assert.equal((await call(`/repos/${repo.id}/snapshot`,'POST',{name:'demo',files:[file('new.ts','new')]})).status,500);
  assert.deepEqual((await pool.query('SELECT path FROM repository_files WHERE repo_id=$1',[repo.id])).rows.map(f=>f.path),['src/auth.ts']);
  await pool.query('DROP TRIGGER reject_snapshot_test ON repository_files; DROP FUNCTION reject_snapshot_test();');
  assert.equal((await call(`/repos/${repo.id}`,'DELETE')).status,200);
  assert.equal((await pool.query('SELECT * FROM repository_files WHERE repo_id=$1',[repo.id])).rowCount,0);
 }finally{await new Promise(r=>server.close(r));globalThis.fetch=realFetch;await pool.end();}
});
