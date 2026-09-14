<script>
 import { supabase,searchText } from './supabase';
 export let table; export let value=''; export let label; export let flag; export let disabled=false;
 let term='', results=[], selected=null, error='', busy=false, timer, version=0;
 $: if(value) fetchSelected(value,table); else selected=null;
 async function fetchSelected(id,t){const {data,error:e}=await supabase.from(t).select('*').eq('id',id).single();if(value===id){selected=data;if(e)error=e.message;}}
 function name(row){return table==='Companies'?row['Company Name']:[row['First Name'],row['Last Name']].filter(Boolean).join(' ');}
 function schedule(){clearTimeout(timer);timer=setTimeout(search,300);}
 async function search(){const seq=++version;busy=true;error='';let q=supabase.from(table).select('*').eq(flag,true).limit(15);const t=searchText(term);if(t){q=table==='Companies'?q.ilike('Company Name',`%${t}%`):q.or(`First Name.ilike.%${t}%,Last Name.ilike.%${t}%`);}const {data,error:e}=await q.order(table==='Companies'?'Company Name':'Last Name');if(seq!==version)return;results=data||[];error=e?.message||'';busy=false;}
</script>
<div class="selector">
 {#if selected}<div class="selected">{name(selected)} {#if !disabled}<button type="button" class="text" on:click={()=>{value='';results=[];term='';}}>Clear</button>{/if}</div>{/if}
 {#if !disabled}
 <input aria-label={label} placeholder={`Search ${label.toLowerCase()}…`} bind:value={term} on:input={schedule} on:focus={search}/>
 {#if busy}<small>Searching…</small>{/if}
 {#if error}<p class="error">{error}</p>{/if}
 {#if results.length}<div class="options">{#each results as row}<button type="button" on:click={()=>{value=row.id;selected=row;results=[];term='';}}>{name(row)}</button>{/each}</div>{:else if term&&!busy}<small>No matching results.</small>{/if}
 {/if}
</div>
