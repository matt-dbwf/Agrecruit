<script>
 import { quoteIdentifier } from './postgrest';
 import { supabase,searchText } from './supabase';
 export let table; export let value=''; export let label; export let flag=null; export let nameField=null; export let nameFn=null; export let sortField=null; export let searchFields=null; export let filterColumn=null; export let filterValue=null; export let disabled=false; export let hidePlaceholder=false;
 let term='', results=[], selected=null, error='', busy=false, timer, version=0;
 $: if(value) fetchSelected(value,table); else selected=null;
 async function fetchSelected(id,t){const {data,error:e}=await supabase.from(t).select('*').eq('id',id).single();if(value===id){selected=data;if(e)error=e.message;}}
 function name(row){if(nameFn)return nameFn(row);if(nameField)return row[nameField];return table==='Companies'?row.nameCompany:[row.nameFirst,row.nameLast].filter(Boolean).join(' ');}
 function schedule(){clearTimeout(timer);timer=setTimeout(search,300);}
 async function search(){const seq=++version;busy=true;error='';let q=supabase.from(table).select('*').limit(15);if(flag)q=q.eq(flag,true);if(filterColumn&&filterValue)q=q.eq(filterColumn,filterValue);const t=searchText(term);const fields=searchFields||(nameField?[nameField]:table==='Companies'?['nameCompany']:['nameFirst','nameLast']);const sort=sortField||nameField||(table==='Companies'?'nameCompany':'nameLast');if(t){q=fields.length>1?q.or(fields.map(f=>`${f}.ilike.%${t}%`).join(',')):q.ilike(fields[0],`%${t}%`);}const {data,error:e}=await q.order(quoteIdentifier(sort));if(seq!==version)return;results=data||[];error=e?.message||'';busy=false;}
</script>
<div class="selector">
 {#if selected}<div class="selected">{name(selected)} {#if !disabled}<button type="button" class="text" on:click={()=>{value='';results=[];term='';}}>Clear</button>{/if}</div>{:else if disabled&&!hidePlaceholder}<div class="selected placeholder">Not selected</div>{/if}
 {#if !disabled&&!selected}
 <input aria-label={label} placeholder={`Search ${label.toLowerCase()}…`} bind:value={term} on:input={schedule} on:focus={search}/>
 {#if busy}<small>Searching…</small>{/if}
 {#if error}<p class="error">{error}</p>{/if}
 {#if results.length}<div class="options">{#each results as row}<button type="button" on:click={()=>{value=row.id;selected=row;results=[];term='';}}>{name(row)}</button>{/each}</div>{:else if term&&!busy}<small>No matching results.</small>{/if}
 {/if}
</div>
