<script>
 import { onMount } from 'svelte';import {supabase} from './supabase';
 export let company;export let open;
 let rows=[],page=0,count=0,busy=false,error='',adding=false,saving=false;
 let form={nameFirst:'',nameLast:'',phone:'',mobile:'',email:'',position:''};
 onMount(load);
 async function load(){busy=true;const r=await supabase.from('People').select('id,nameFirst,nameLast,position',{count:'exact'}).eq('id_Company',company).order('nameLast').range(page*25,page*25+24);rows=r.data||[];count=r.count||0;error=r.error?.message||'';busy=false;}
 function openModal(){form={nameFirst:'',nameLast:'',phone:'',mobile:'',email:'',position:''};error='';adding=true;}
 function closeModal(){if(!saving){adding=false;error='';}}
 function onKey(e){if(adding&&e.key==='Escape')closeModal();}
 async function addContact(){if(!form.nameFirst.trim()||!form.nameLast.trim())return;saving=true;error='';const values={nameFirst:form.nameFirst.trim(),nameLast:form.nameLast.trim(),phone:form.phone.trim()||null,mobile:form.mobile.trim()||null,email:form.email.trim()||null,position:form.position.trim()||null,id_Company:company,flag_Seeker:false};const r=await supabase.from('People').insert(values).select().single();if(r.error){error=r.error.message;saving=false;return;}saving=false;adding=false;page=0;await load();}
</script>
<svelte:window on:keydown={onKey}/>
<section class="panel"><div class="toolbar"><h2>Contacts</h2><button class="secondary" on:click={openModal}>Add Contact</button></div>{#if error&&!adding}<p role="alert" class="error">{error}</p>{/if}
{#if busy}<p>Loading…</p>{:else}<table><tbody>{#each rows as row}<tr class="row-link" tabindex="0" role="button" aria-label={`Open ${row.nameFirst} ${row.nameLast}`} on:click={()=>open(row.id)} on:keydown={e=>{if(e.key==='Enter')open(row.id);}}><td>{row.nameFirst} {row.nameLast}</td><td>{row.position||'—'}</td></tr>{:else}<tr><td colspan="2">No Contacts linked.</td></tr>{/each}</tbody></table>{/if}
{#if count>25}<div class="pagination"><button disabled={page===0||busy} on:click={()=>{page--;load();}}>Previous</button><span>Page {page+1}</span><button disabled={(page+1)*25>=count||busy} on:click={()=>{page++;load();}}>Next</button></div>{/if}
</section>
{#if adding}
<div class="modal-overlay" on:click={closeModal}>
<div class="modal panel" on:click|stopPropagation role="dialog" aria-modal="true" aria-label="Add Contact">
<h2>Add Contact</h2>
{#if error}<p role="alert" class="error">{error}</p>{/if}
<div class="form-grid">
<label>First Name <span class="required">*</span><input bind:value={form.nameFirst} disabled={saving}/></label>
<label>Last Name <span class="required">*</span><input bind:value={form.nameLast} disabled={saving}/></label>
<label>Phone<input bind:value={form.phone} disabled={saving}/></label>
<label>Mobile<input bind:value={form.mobile} disabled={saving}/></label>
<label>Email<input type="email" bind:value={form.email} disabled={saving}/></label>
<label>Position<input bind:value={form.position} disabled={saving}/></label>
</div>
<div class="actions"><button type="button" class="secondary" disabled={saving} on:click={closeModal}>Cancel</button><button disabled={saving||!form.nameFirst.trim()||!form.nameLast.trim()} on:click={addContact}>{saving?'Saving…':'Save'}</button></div>
</div>
</div>
{/if}
