<script>
 import {onMount} from 'svelte';import {supabase,employeeAction} from './supabase';import Selector from './Selector.svelte';import JobSeekers from './JobSeekers.svelte';import EntityLinks from './EntityLinks.svelte';import CompanyContacts from './CompanyContacts.svelte';import CompanyAddresses from './CompanyAddresses.svelte';
 export let table;export let id;export let back;export let saved;export let canEditEmployees=true;export let seekerMode=false;export let clientMode=false;export let navigate=()=>{};
 let original=null,form={},editing=id==='new',busy=false,loading=id!=='new',error='',createUser=false,loginEmail='',password='',manager=false;
 const fields={Jobs:[['title','Title'],['id_Status','Status',false],['descriptionBrief','Brief Description',false],['location','Location',false],['id_Industry','Industry',false],['dateStart','Start Date',false],['typeEmployment','Employment Type',false],['salaryMin','Salary Min',false],['salaryMax','Salary Max',false],['descriptionFull','Full Description',false],['experience','Experience',false],['instructions','Instructions',false]],Employees:[['nameFirst','First Name'],['nameLast','Last Name'],['email','Email']],Industries:[['nameIndustry','Name']],Skills:[['nameSkill','Name']],Licenses:[['nameLicense','Name']],Education:[['nameEducation','Name']],Statuses:[['status','Status'],['sort','Sort Order',false]]};
 const selectorFields={id_Industry:{table:'Industries',nameField:'nameIndustry',label:'Industries'},id_Status:{table:'Statuses',nameField:'status',label:'Statuses'}};
 const nameFields=[['nameFirst','First Name'],['nameLast','Last Name']];
 const contactSection=[['_section_contact','Contact'],['phone','Phone',false],['mobile','Mobile',false],['email','Email',false],['linkedInURL','LinkedIn URL',false]];
 const employmentSection=[['_section_employment','Employment'],['dateOfBirth','Date of Birth',false],['source','Source',false],['currentPosition','Current Position',false],['currentSalary','Current Salary',false],['salaryRange','Salary Range',false]];
 const addressSections=[['_section_physical','Physical Address'],['physicalStreet','Street',false],['physicalSuburb','Suburb',false],['physicalState','State',false],['physicalPostcode','Postcode',false],['physicalCountry','Country',false],['_section_mailing','Mailing Address'],['mailingStreet','Street',false],['mailingSuburb','Suburb',false],['mailingState','State',false],['mailingPostcode','Postcode',false],['mailingCountry','Country',false]];
 const contactFields=[...nameFields,...contactSection,...addressSections];
 const seekerFields=[...nameFields,...contactSection,...employmentSection,...addressSections];
 const companyFields=[['nameCompany','Company Name'],['_section_contact','Contact'],['phone','Phone',false],['mobile','Mobile',false],['email','Email',false],['website','Website',false],['_section_business','Business Numbers'],['ACN','ACN',false],['ABN','ABN',false]];
 const clientFields=[['nameCompany','Company Name'],['_section_client','Client Details'],['splitAgrecruit','Agrecruit %',false],['terms','Terms',false]];
 $: currentFields=table==='People'?(seekerMode?seekerFields:contactFields):table==='Companies'?(clientMode?clientFields:companyFields):fields[table];
 const fieldType=key=>key==='email'?'email':(key==='linkedInURL'||key==='website')?'url':(key==='dateOfBirth'||key==='dateStart')?'date':(key==='currentSalary'||key==='splitAgrecruit'||key==='salaryMin'||key==='salaryMax'||key==='sort')?'number':'text';
 const isCurrency=key=>key==='salaryMin'||key==='salaryMax';
 const inputType=(key,ed)=>isCurrency(key)?'text':(!ed&&fieldType(key)==='date')?'text':fieldType(key);
 function numericValue(key,raw){if(raw===''||raw==null)return null;if(isCurrency(key)){const cleaned=String(raw).replace(/[^0-9.\-]/g,'');return cleaned===''?null:cleaned;}return raw;}
 function formatCurrency(v){if(v===''||v==null)return'';const n=Number(v);return isNaN(n)?String(v):'$'+n.toLocaleString('en-US');}
 const isRequired=(table,key,flag,form)=>table==='Employees'&&key==='email'?!!form.id_User:flag!==false;
 const singular={Jobs:'Job',Companies:'Company',People:'Person',Employees:'Employee',Industries:'Industry',Skills:'Skill',Licenses:'License',Education:'Education',Statuses:'Status'};
 $: recordLabel=table==='People'?(seekerMode?'Seeker':'Person'):table==='Companies'?(clientMode?'Client':'Company'):singular[table];
 $: backLabel=table==='People'?(seekerMode?'Seekers':'People'):table==='Companies'?(clientMode?'Clients':'Companies'):table;
 function switchView(){navigate(table==='People'?(seekerMode?'People':'Seekers'):table==='Companies'?(clientMode?'Companies':'Clients'):table,id);}
 function openPicker(key,e){if(fieldType(key)==='date')try{e.target.showPicker?.();}catch{}}
 let lastCompany;
 $: if(table==='Jobs'){if(lastCompany!==undefined&&lastCompany!==form.id_Company){form.id_Contact='';form.id_Address='';}lastCompany=form.id_Company;}
 async function nextSort(){const r=await supabase.from('Statuses').select('sort').order('sort',{ascending:false,nullsFirst:false}).limit(1);const max=r.data?.[0]?.sort;return (typeof max==='number'?max:0)+1;}
 onMount(async()=>{if(id==='new'){form=table==='Jobs'?{id_Company:'',id_Contact:'',id_Address:'',id_Employee:'',id_Industry:'',id_Status:''}:table==='Companies'?{flag_Client:false}:table==='People'?{flag_Seeker:seekerMode}:table==='Employees'?{flag_Manager:false}:table==='Statuses'?{sort:await nextSort(),flag_Display:true}:{};return;}const r=await supabase.from(table).select('*').eq('id',id).single();error=r.error?.message||'';original=r.data;form={...original};loading=false;});
 $: passwordValid=password.length>=12&&/[a-z]/.test(password)&&/[A-Z]/.test(password)&&/[0-9]/.test(password)&&/[^A-Za-z0-9]/.test(password);
 function cancel(){if(id==='new')back();else{form={...original};editing=false;error='';}}
 async function save(){busy=true;error='';try{let data;if(table==='Employees'){data=await employeeAction('save',{...(id==='new'?{}:{id}),...form});}else{const values={};for(const [key]of currentFields){if(key.startsWith('_section_'))continue;const t=fieldType(key);const raw=form[key];values[key]=(t==='number'||t==='date')?numericValue(key,raw):String(raw||'').trim();}if(table==='Jobs'){values.id_Company=form.id_Company;values.id_Contact=form.id_Contact||null;values.id_Address=form.id_Address||null;values.id_Employee=form.id_Employee||null;values.id_Industry=form.id_Industry||null;values.id_Status=form.id_Status||null;}if(table==='Companies')values.flag_Client=form.flag_Client===true;if(table==='People'){values.flag_Seeker=form.flag_Seeker===true;if(!seekerMode){values.id_Company=form.id_Company||null;values.position=String(form.position||'').trim()||null;}}if(table==='Statuses')values.flag_Display=form.flag_Display===true;const r=id==='new'?await supabase.from(table).insert(values).select().single():await supabase.from(table).update(values).eq('id',id).select().single();if(r.error)throw r.error;data=r.data;}original=data;form={...data};editing=false;if(id==='new')saved(data.id);}catch(e){error=e.message;}busy=false;}
 async function makeUser(){busy=true;error='';try{const data=await employeeAction('create-user',{id,email:loginEmail,password,flag_Manager:manager});original=data;form={...data};createUser=false;password='';}catch(e){error=e.message;}busy=false;}
</script>
<div class="toolbar"><div><button class="text" on:click={back}>← {backLabel}</button><h1>{id==='new'?'New ':''}{recordLabel}{table==='Jobs'&&original?` #${original['seq']}`:''}</h1></div><div class="button-group">{#if !editing&&!loading&&original&&(table!=='Employees'||canEditEmployees)}<button class="secondary" on:click={()=>{editing=true;createUser=false;}}>Edit</button>{/if}{#if table==='People'&&!editing&&!loading&&original&&(seekerMode||original.flag_Seeker)}<button class="secondary" on:click={switchView}>{seekerMode?'Go to Person':'Go to Seeker'}</button>{/if}{#if table==='Companies'&&!editing&&!loading&&original&&(clientMode||original.flag_Client)}<button class="secondary" on:click={switchView}>{clientMode?'Go to Company':'Go to Client'}</button>{/if}</div></div>
{#if error}<p role="alert" class="error">{error}</p>{/if}
{#if loading}<p>Loading…</p>{:else if id==='new'||original}
<form on:submit|preventDefault={save}><div class="panel">
{#if table==='Jobs'}<h2>Job Details</h2>{/if}
<div class="form-grid">
{#each currentFields as [key,label,required]}{#if key.startsWith('_section_')}<h3 class="wide section-heading">{label}</h3>{:else if key==='terms'||key==='descriptionFull'||key==='instructions'||key==='experience'}<label class="wide">{label}<textarea bind:value={form[key]} readonly={!editing||busy} rows="4"></textarea></label>{:else if selectorFields[key]}<div class="field">{label}<Selector table={selectorFields[key].table} nameField={selectorFields[key].nameField} label={selectorFields[key].label} bind:value={form[key]} disabled={!editing||busy}/></div>{:else}<label class={key==='descriptionBrief'?'wide':''}><span>{label}{#if editing&&isRequired(table,key,required,form)} <span class="required">*</span>{/if}</span>{#if isCurrency(key)&&!editing}<input type="text" readonly value={formatCurrency(form[key])}/>{:else}<input type={inputType(key,editing)} inputmode={isCurrency(key)?'decimal':undefined} bind:value={form[key]} readonly={!editing||busy} required={isRequired(table,key,required,form)} on:click={e=>openPicker(key,e)}/>{/if}</label>{/if}{/each}
{#if table==='Companies'}<label class="check"><input type="checkbox" bind:checked={form.flag_Client} disabled={!editing||busy}/>Client</label>{/if}
{#if table==='People'}<label class="check"><input type="checkbox" bind:checked={form.flag_Seeker} disabled={!editing||busy}/>Seeker</label>{#if !seekerMode}<div class="wide field">Company<Selector table="Companies" nameField="nameCompany" label="Companies" bind:value={form.id_Company} disabled={!editing||busy}/></div><label>Position<input type="text" bind:value={form.position} readonly={!editing||busy}/></label>{/if}{/if}
{#if table==='Employees'}<label class="check"><input type="checkbox" bind:checked={form.flag_Manager} disabled={!editing||busy||id==='new'}/>Manager</label>{#if id==='new'}<small>New Employees start without Manager access.</small>{/if}<label>User Account<input readonly value={form.id_User?'Linked':'No account'}/></label>{/if}
{#if table==='Statuses'}<label class="check"><input type="checkbox" bind:checked={form.flag_Display} disabled={!editing||busy}/>Show in Navigation</label><small>Home always lists every status, regardless of this setting.</small>{/if}
</div></div>
{#if table==='Jobs'}
<div class="panel"><h2>Client Details</h2><div class="form-grid">
<div class="wide field"><span>Client {#if editing}<span class="required">*</span>{/if}</span><Selector table="Companies" flag="flag_Client" label="Clients" bind:value={form.id_Company} disabled={!editing||busy}/>{#if editing&&!form.id_Company}<small>Select a Company marked as a Client.</small>{/if}</div>
<div class="wide field">Contact<Selector table="People" filterColumn="id_Company" filterValue={form.id_Company} label="Contacts" bind:value={form.id_Contact} disabled={!editing||busy||!form.id_Company} hidePlaceholder={editing}/>{#if editing&&!form.id_Company}<small>Select a Client first.</small>{/if}</div>
<div class="wide field">Address<Selector table="CompanyAddresses" filterColumn="id_Company" filterValue={form.id_Company} nameFn={row=>[row.label,row.street].filter(Boolean).join(' — ')||'Address'} sortField="label" searchFields={['label','street','suburb','postcode']} label="Addresses" bind:value={form.id_Address} disabled={!editing||busy||!form.id_Company} hidePlaceholder={editing}/>{#if editing&&!form.id_Company}<small>Select a Client first.</small>{/if}</div>
<div class="wide field">Employee<Selector table="Employees" label="Employees" bind:value={form.id_Employee} disabled={!editing||busy}/></div>
</div></div>
{/if}
{#if editing}<small>* Required fields</small><div class="actions"><button type="button" class="secondary" disabled={busy} on:click={cancel}>Cancel</button><button disabled={busy||(table==='Jobs'&&!form.id_Company)}>{busy?'Saving…':'Save'}</button></div>{/if}</form>
{#if table==='Jobs'&&id!=='new'&&!editing}<JobSeekers job={id}/>{/if}
{#if table==='People'&&id!=='new'&&!editing&&seekerMode}
<div class="pair-grid">
<EntityLinks ownerId={id} junctionTable="PersonIndustries" linkColumn="id_Industry" lookupTable="Industries" nameField="nameIndustry" label="Industries" singular="Industry"/>
<EntityLinks ownerId={id} junctionTable="PersonSkills" linkColumn="id_Skill" lookupTable="Skills" nameField="nameSkill" label="Skills" singular="Skill"/>
</div>
<div class="pair-grid">
<EntityLinks ownerId={id} junctionTable="PersonEducation" linkColumn="id_Education" lookupTable="Education" nameField="nameEducation" label="Education" singular="Education"/>
<EntityLinks ownerId={id} junctionTable="PersonLicenses" linkColumn="id_License" lookupTable="Licenses" nameField="nameLicense" label="Licenses" singular="License"/>
</div>
{/if}
{#if table==='Companies'&&id!=='new'&&!editing&&clientMode}
<EntityLinks ownerId={id} ownerColumn="id_Company" junctionTable="CompanyIndustries" linkColumn="id_Industry" lookupTable="Industries" nameField="nameIndustry" label="Industries" singular="Industry"/>
{/if}
{#if table==='Companies'&&id!=='new'&&!editing}
<div class="pair-grid">
<CompanyAddresses company={id}/>
<CompanyContacts company={id} open={personId=>navigate('People',personId)}/>
</div>
{/if}
{#if table==='Employees'&&id!=='new'&&!form.id_User&&!editing&&canEditEmployees}
{#if !createUser}<div class="actions"><button on:click={()=>{loginEmail=form.email||'';manager=form.flag_Manager;createUser=true;}}>Create User</button></div>{:else}<form class="panel" on:submit|preventDefault={makeUser}><h2>Create User</h2><div class="form-grid"><label>Login Email<input type="email" required bind:value={loginEmail}/></label><label>Temporary Password<input type="password" autocomplete="new-password" required bind:value={password}/></label><label class="check"><input type="checkbox" bind:checked={manager}/>Manager access</label></div><p class:valid={passwordValid}>Password requires at least 12 characters with an uppercase letter, lowercase letter, number and symbol.</p><div class="actions"><button type="button" class="secondary" disabled={busy} on:click={()=>{createUser=false;password='';}}>Cancel</button><button disabled={busy||!passwordValid||!loginEmail}>{busy?'Creating…':'Create User'}</button></div></form>{/if}
{/if}{/if}
