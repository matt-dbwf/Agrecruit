<script>
 import { onDestroy } from 'svelte';
 import { supabase,searchText } from './supabase';
 export let table;export let open;
 let rows=[], filters={}, page=0,count=0,busy=false,error='',timer,version=0;
 const definitions={Jobs:[['Sequence #','number'],['Status','status'],['Title','text']],Companies:[['Company Name','text'],['flag_Client','boolean','Client']],People:[['First Name','text'],['Last Name','text'],['flag_Seeker','boolean','Seeker']],Employees:[['nameFirst','text','First Name'],['nameLast','text','Last Name'],['email','text','Email'],['id_User','account','User Account'],['flag_Manager','boolean','Manager']]};
 $: columns=definitions[table];
 $: reset(table);
 function reset(t){filters={};page=0;load(t,0,{});}
 function schedule(){page=0;clearTimeout(timer);timer=setTimeout(()=>load(table,page,filters),300);}
 async function load(t,p,f){const seq=++version;busy=true;error='';let q=supabase.from(t).select(t==='Jobs'?'*,Companies(Company Name)':'*',{count:'exact'}).order(t==='Jobs'?'Sequence #':definitions[t][0][0],{ascending:t!=='Jobs'}).range(p*25,p*25+24);
 for(const [key,type] of definitions[t]){const val=f[key];if(val==null||val==='')continue;if(type==='boolean')q=q.eq(key,val==='true');else if(type==='account')q=val==='true'?q.not(key,'is',null):q.is(key,null);else if(type==='number'){if(/^\d+$/.test(val))q=q.eq(key,val);else {rows=[];count=0;busy=false;error='Sequence # must be a number.';return;}}else q=q.ilike(key,`%${searchText(val)}%`);}
 const {data,error:e,count:c}=await q;if(seq!==version)return;rows=data||[];count=c||0;error=e?.message||'';busy=false;
 }
 function turn(delta){page+=delta;load(table,page,filters);}
 onDestroy(()=>{clearTimeout(timer);version++;});
</script>
<div class="toolbar"><div><h1>{table}</h1><p>{count} record{count===1?'':'s'}</p></div><button on:click={()=>open('new')}>New {table==='People'?'Person':table==='Companies'?'Company':table==='Employees'?'Employee':'Job'}</button></div>
{#if error}<p role="alert" class="error">{error}</p>{/if}
<div class="panel table-wrap"><table><thead><tr>{#each columns as [key,type,label]}<th>{label||key}
 {#if ['boolean','account','status'].includes(type)}<select aria-label={`Filter ${label||key}`} bind:value={filters[key]} on:change={schedule}><option value="">All</option>{#if type==='status'}<option>Pending</option>{:else}<option value="true">{type==='account'?'Linked':'Yes'}</option><option value="false">{type==='account'?'No account':'No'}</option>{/if}</select>{:else}<input aria-label={`Filter ${label||key}`} placeholder="Filter…" bind:value={filters[key]} on:input={schedule}/>{/if}
 </th>{/each}{#if table==='Jobs'}<th>Client</th>{/if}<th></th></tr></thead><tbody>
 {#if busy}<tr><td colspan="8">Loading…</td></tr>{:else}{#each rows as row}<tr>{#each columns as [key,type]}<td>{type==='boolean'?(row[key]?'Yes':'No'):type==='account'?(row[key]?'Linked':'No account'):row[key]||'—'}</td>{/each}{#if table==='Jobs'}<td>{row.Companies?.['Company Name']||'—'}</td>{/if}<td><button class="text" on:click={()=>open(row.id)}>Open</button></td></tr>{:else}<tr><td colspan="8">No records found.</td></tr>{/each}{/if}
 </tbody></table></div>
<div class="pagination"><button class="secondary" disabled={page===0||busy} on:click={()=>turn(-1)}>Previous</button><span>Page {page+1} of {Math.max(1,Math.ceil(count/25))}</span><button class="secondary" disabled={(page+1)*25>=count||busy} on:click={()=>turn(1)}>Next</button></div>
