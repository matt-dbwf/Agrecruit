<script>
 import { onMount } from 'svelte';import {supabase} from './supabase';
 export let company;
 let rows=[],page=0,count=0,busy=false,error='',adding=false,saving=false;
 let form={label:'',street:'',suburb:'',state:'',postcode:'',country:''};
 onMount(load);
 async function load(){busy=true;const r=await supabase.from('CompanyAddresses').select('*',{count:'exact'}).eq('id_Company',company).order('id').range(page*25,page*25+24);rows=r.data||[];count=r.count||0;error=r.error?.message||'';busy=false;}
 function openModal(){form={label:'',street:'',suburb:'',state:'',postcode:'',country:''};error='';adding=true;}
 function closeModal(){if(!saving){adding=false;error='';}}
 function onKey(e){if(adding&&e.key==='Escape')closeModal();}
 function summary(row){return [row.street,row.suburb,row.state,row.postcode,row.country].filter(Boolean).join(', ')||'—';}
 async function addAddress(){saving=true;error='';const values={id_Company:company,label:form.label.trim()||null,street:form.street.trim()||null,suburb:form.suburb.trim()||null,state:form.state.trim()||null,postcode:form.postcode.trim()||null,country:form.country.trim()||null};const r=await supabase.from('CompanyAddresses').insert(values);if(r.error){error=r.error.message;saving=false;return;}saving=false;adding=false;page=0;await load();}
 async function remove(id){busy=true;const r=await supabase.from('CompanyAddresses').delete().eq('id',id);if(r.error){error=r.error.message;busy=false;return;}if(rows.length===1&&page>0)page--;await load();}
</script>
<svelte:window on:keydown={onKey}/>
<section class="panel"><div class="toolbar"><h2>Addresses</h2><button class="secondary" on:click={openModal}>Add Address</button></div>{#if error&&!adding}<p role="alert" class="error">{error}</p>{/if}
{#if busy}<p>Loading…</p>{:else}<table><tbody>{#each rows as row}<tr><td>{row.label||'Address'}</td><td>{summary(row)}</td><td class="right"><button class="text" on:click={()=>remove(row.id)}>Remove</button></td></tr>{:else}<tr><td colspan="3">No Addresses linked.</td></tr>{/each}</tbody></table>{/if}
{#if count>25}<div class="pagination"><button disabled={page===0||busy} on:click={()=>{page--;load();}}>Previous</button><span>Page {page+1}</span><button disabled={(page+1)*25>=count||busy} on:click={()=>{page++;load();}}>Next</button></div>{/if}
</section>
{#if adding}
<div class="modal-overlay" on:click={closeModal}>
<div class="modal panel" on:click|stopPropagation role="dialog" aria-modal="true" aria-label="Add Address">
<h2>Add Address</h2>
{#if error}<p role="alert" class="error">{error}</p>{/if}
<div class="form-grid">
<label class="wide">Label<input bind:value={form.label} disabled={saving} placeholder="e.g. Head Office"/></label>
<label class="wide">Street<input bind:value={form.street} disabled={saving}/></label>
<label>Suburb<input bind:value={form.suburb} disabled={saving}/></label>
<label>State<input bind:value={form.state} disabled={saving}/></label>
<label>Postcode<input bind:value={form.postcode} disabled={saving}/></label>
<label>Country<input bind:value={form.country} disabled={saving}/></label>
</div>
<div class="actions"><button type="button" class="secondary" disabled={saving} on:click={closeModal}>Cancel</button><button disabled={saving} on:click={addAddress}>{saving?'Saving…':'Save'}</button></div>
</div>
</div>
{/if}
