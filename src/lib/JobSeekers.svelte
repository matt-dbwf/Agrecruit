<script>
 import { onMount } from 'svelte';import {supabase} from './supabase';import Selector from './Selector.svelte';
 export let job;let rows=[],person='',page=0,count=0,busy=false,error='',editing=false;
 onMount(load);
 async function load(){busy=true;const r=await supabase.from('JobSeekers').select('id,People(id,First Name,Last Name)',{count:'exact'}).eq('id_Job',job).order('id').range(page*25,page*25+24);rows=r.data||[];count=r.count||0;error=r.error?.message||'';busy=false;}
 async function add(){busy=true;error='';const r=await supabase.from('JobSeekers').insert({id_Job:job,id_Person:person});if(r.error){error=r.error.code==='23505'?'This Seeker is already linked to this Job.':r.error.message;busy=false;}else{person='';page=0;await load();}}
 async function remove(id){busy=true;const r=await supabase.from('JobSeekers').delete().eq('id',id).eq('id_Job',job);if(r.error){error=r.error.message;busy=false;}else{if(rows.length===1&&page>0)page--;await load();}}
</script>
<section class="panel"><div class="toolbar"><h2>Seekers</h2>{#if !editing}<button class="secondary" on:click={()=>editing=true}>Edit Seekers</button>{:else}<button class="secondary" on:click={()=>{editing=false;person='';}}>Done</button>{/if}</div>{#if error}<p role="alert" class="error">{error}</p>{/if}
{#if busy}<p>Loading…</p>{:else}<table><tbody>{#each rows as row}<tr><td>{row.People?.['First Name']} {row.People?.['Last Name']}</td><td class="right">{#if editing}<button class="text" on:click={()=>remove(row.id)}>Unlink</button>{/if}</td></tr>{:else}<tr><td>No Seekers linked.</td></tr>{/each}</tbody></table>{/if}
{#if count>25}<div class="pagination"><button disabled={page===0||busy} on:click={()=>{page--;load();}}>Previous</button><span>Page {page+1}</span><button disabled={(page+1)*25>=count||busy} on:click={()=>{page++;load();}}>Next</button></div>{/if}
{#if editing}<div class="link-form"><label>Link a Seeker<Selector table="People" flag="flag_Seeker" label="Seekers" bind:value={person}/></label></div><div class="actions"><button disabled={!person||busy} on:click={add}>Save</button></div><small>Select a Seeker, then Save to link them to this Job. Unlink removes an existing association immediately.</small>{/if}
</section>
