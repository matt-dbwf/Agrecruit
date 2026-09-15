<script>
 import { quoteIdentifier } from './postgrest';
 import { onDestroy } from 'svelte';
 import { supabase,searchText } from './supabase';
 export let table;export let open;export let heading=undefined;export let presetFilter=null;
 let rows=[], filters={}, page=0,count=0,busy=false,error='',timer,version=0;
 const definitions={Jobs:[['seq','number'],['title','text','Title']],Companies:[['nameCompany','text','Company Name']],People:[['nameFirst','text','First Name'],['nameLast','text','Last Name']],Employees:[['nameFirst','text','First Name'],['nameLast','text','Last Name'],['email','text','Email'],['id_User','account','User Account'],['flag_Manager','boolean','Manager']],Industries:[['nameIndustry','text','Name']],Skills:[['nameSkill','text','Name']],Licenses:[['nameLicense','text','Name']],Education:[['nameEducation','text','Name']],Statuses:[['status','text','Status']]};
 const singular={Jobs:'Job',Companies:'Company',People:'Person',Employees:'Employee',Industries:'Industry',Skills:'Skill',Licenses:'License',Education:'Education',Statuses:'Status'};
 $: columns=(definitions[table]||[]).filter(([k])=>!presetFilter||k!==presetFilter.key);
 $: reset(table);
 function reset(t){filters={};page=0;load(t,0,{});}
 function schedule(){page=0;clearTimeout(timer);timer=setTimeout(()=>load(table,page,filters),300);}
 async function load(t,p,f){const seq=++version;busy=true;error='';let q=supabase.from(t).select(t==='Jobs'?'*,Companies(nameCompany),Statuses(status)':t==='People'?'*,Companies(nameCompany)':'*',{count:'exact'}).order(quoteIdentifier(t==='Jobs'?'seq':definitions[t][0][0]),{ascending:t!=='Jobs'}).range(p*25,p*25+24);
 if(presetFilter)q=q.eq(presetFilter.key,presetFilter.value);
 for(const [key,type] of definitions[t]){if(presetFilter&&key===presetFilter.key)continue;const val=f[key];if(val==null||val==='')continue;if(type==='boolean')q=q.eq(key,val==='true');else if(type==='account')q=val==='true'?q.not(key,'is',null):q.is(key,null);else if(type==='number'){if(/^\d+$/.test(val))q=q.eq(key,val);else {rows=[];count=0;busy=false;error='seq must be a number.';return;}}else q=q.ilike(key,`%${searchText(val)}%`);}
 const {data,error:e,count:c}=await q;if(seq!==version)return;rows=data||[];count=c||0;error=e?.message||'';busy=false;
 }
 function turn(delta){page+=delta;load(table,page,filters);}
 function rowLabel(row){return columns.map(([k,t])=>t==='text'||t==='number'?row[k]:null).filter(v=>v!=null&&v!=='').join(' ')||'record';}
 onDestroy(()=>{clearTimeout(timer);version++;});
</script>
<div class="toolbar"><div><h1>{heading||table}</h1><p>{count} record{count===1?'':'s'}</p></div><button on:click={()=>open('new')}>New {singular[table]}</button></div>
{#if error}<p role="alert" class="error">{error}</p>{/if}
<div class="panel table-wrap"><table><thead><tr>{#each columns as [key,type,label]}<th>{label||key}
 {#if table!=='Jobs'}{#if ['boolean','account'].includes(type)}<select aria-label={`Filter ${label||key}`} bind:value={filters[key]} on:change={schedule}><option value="">All</option><option value="true">{type==='account'?'Linked':'Yes'}</option><option value="false">{type==='account'?'No account':'No'}</option></select>{:else}<input aria-label={`Filter ${label||key}`} placeholder="Filter…" bind:value={filters[key]} on:input={schedule}/>{/if}{/if}
 </th>{/each}{#if table==='Jobs'}{#if !(presetFilter&&presetFilter.key==='id_Status')}<th>Status</th>{/if}<th>Client</th>{/if}{#if table==='People'&&heading!=='Seekers'}<th>Company</th><th>Position</th>{/if}</tr></thead><tbody>
 {#if busy}<tr><td colspan="8">Loading…</td></tr>{:else}{#each rows as row}<tr class="row-link" tabindex="0" role="button" aria-label={`Open ${rowLabel(row)}`} on:click={()=>open(row.id)} on:keydown={e=>{if(e.key==='Enter')open(row.id);}}>{#each columns as [key,type]}<td>{type==='boolean'?(row[key]?'Yes':'No'):type==='account'?(row[key]?'Linked':'No account'):row[key]||'—'}</td>{/each}{#if table==='Jobs'}{#if !(presetFilter&&presetFilter.key==='id_Status')}<td>{row.Statuses?.status||'—'}</td>{/if}<td>{row.Companies?.nameCompany||'—'}</td>{/if}{#if table==='People'&&heading!=='Seekers'}<td>{row.Companies?.nameCompany||'—'}</td><td>{row.position||'—'}</td>{/if}</tr>{:else}<tr><td colspan="8">No records found.</td></tr>{/each}{/if}
 </tbody></table></div>
<div class="pagination"><button class="secondary" disabled={page===0||busy} on:click={()=>turn(-1)}>Previous</button><span>Page {page+1} of {Math.max(1,Math.ceil(count/25))}</span><button class="secondary" disabled={(page+1)*25>=count||busy} on:click={()=>turn(1)}>Next</button></div>
