<script>
 import { onMount } from 'svelte';import {supabase} from './supabase';import Selector from './Selector.svelte';
 export let person;export let junctionTable;export let linkColumn;export let lookupTable;export let nameField;export let label;export let singular;
 let rows=[],selected='',page=0,count=0,busy=false,error='',editing=false;
 onMount(load);
 async function load(){busy=true;const r=await supabase.from(junctionTable).select(`id,${lookupTable}(id,${nameField})`,{count:'exact'}).eq('id_Person',person).order('id').range(page*25,page*25+24);rows=r.data||[];count=r.count||0;error=r.error?.message||'';busy=false;}
 async function add(){busy=true;error='';const r=await supabase.from(junctionTable).insert({id_Person:person,[linkColumn]:selected});if(r.error){error=r.error.code==='23505'?`This ${singular} is already linked.`:r.error.message;busy=false;}else{selected='';page=0;await load();}}
 async function remove(id){busy=true;const r=await supabase.from(junctionTable).delete().eq('id',id).eq('id_Person',person);if(r.error){error=r.error.message;busy=false;}else{if(rows.length===1&&page>0)page--;await load();}}
</script>
<section class="panel"><div class="toolbar"><h2>{label}</h2>{#if !editing}<button class="secondary" on:click={()=>editing=true}>Edit {label}</button>{:else}<button class="secondary" on:click={()=>{editing=false;selected='';}}>Done</button>{/if}</div>{#if error}<p role="alert" class="error">{error}</p>{/if}
{#if busy}<p>Loading…</p>{:else}<table><tbody>{#each rows as row}<tr><td>{row[lookupTable]?.[nameField]}</td><td class="right">{#if editing}<button class="text" on:click={()=>remove(row.id)}>Unlink</button>{/if}</td></tr>{:else}<tr><td>No {label} linked.</td></tr>{/each}</tbody></table>{/if}
{#if count>25}<div class="pagination"><button disabled={page===0||busy} on:click={()=>{page--;load();}}>Previous</button><span>Page {page+1}</span><button disabled={(page+1)*25>=count||busy} on:click={()=>{page++;load();}}>Next</button></div>{/if}
{#if editing}<div class="link-form"><label>Add a {singular}<Selector table={lookupTable} nameField={nameField} label={label} bind:value={selected}/></label></div><div class="actions"><button disabled={!selected||busy} on:click={add}>Save</button></div><small>Select a {singular}, then Save to link it.</small>{/if}
</section>
