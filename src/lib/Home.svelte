<script>
 export let employee; export let navigate;
 const tiles=[['Jobs','Review and add recruitment jobs.'],['Companies','Manage client and other companies.'],['People','Manage job seekers and other contacts.'],['Industries','Maintain the Industries list.'],['Skills','Maintain the Skills list.'],['Licenses','Maintain the Licenses list.'],['Education','Maintain the Education list.']];
 $: allTiles=[...tiles,...(employee?.flag_Manager?[['Employees','Manage staff access and Manager permissions.']]:[])];
</script>
<div class="toolbar"><div><h1>Welcome{employee?.nameFirst?`, ${employee.nameFirst}`:''}</h1><p>Pick a section below to get started.</p></div></div>
<div class="home-grid">
{#each allTiles as [name,blurb]}
<button type="button" class="tile" on:click={()=>navigate(name)}>
 <strong>{name}</strong>
 <span>{blurb}</span>
</button>
{/each}
</div>
