import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {quoteIdentifier} from '../src/lib/postgrest.js';
import {readFileSync} from 'node:fs';
let request;
const db=createClient('https://example.supabase.co','test',{global:{fetch:async(url)=>{request=new URL(url);return new Response('[]',{headers:{'Content-Type':'application/json'}});}},auth:{persistSession:false}});
test('Jobs request quotes seq and preserves the embedded nameCompany',async()=>{
 const source=readFileSync(new URL('../src/lib/List.svelte',import.meta.url),'utf8');
 assert.ok(source.includes(".order(quoteIdentifier(t==='Jobs'?'seq'"));
 const selection=source.match(/select\(t==='Jobs'\?'([^']+)'/)[1];
 await db.from('Jobs').select(selection).order(quoteIdentifier('seq'),{ascending:false}).range(0,24);
 assert.equal(request.searchParams.get('order'),'"seq".desc');
 assert.equal(request.searchParams.get('select'),'*,Companies(nameCompany)');
});
test('Selector sorts preserve nameCompany and nameLast',async()=>{
 for(const [table,column] of [['Companies','nameCompany'],['People','nameLast']]){
 await db.from(table).select('*').order(quoteIdentifier(column)).limit(15);
 assert.equal(request.searchParams.get('order'),`"${column}".asc`);
 }
});
test('Linked Seekers selection uses renamed People columns',async()=>{
 const source=readFileSync(new URL('../src/lib/JobSeekers.svelte',import.meta.url),'utf8');
 const selection=source.match(/\.select\('([^']+)'/)[1];
 await db.from('JobSeekers').select(selection);
 assert.equal(request.searchParams.get('select'),'id,People(id,nameFirst,nameLast)');
});
