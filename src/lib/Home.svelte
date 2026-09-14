<script>
 export let employee; export let navigate;
 const tiles=[['Jobs','Review and add recruitment jobs.'],['Companies','Manage client and other companies.'],['Clients','Companies flagged as Clients.'],['People','Manage job seekers and other contacts.'],['Seekers','People flagged as Seekers.'],['Settings','Manage Industries, Skills, Licenses, Education and Employees.']];
</script>
<div class="toolbar"><div><h1>Welcome{employee?.nameFirst?`, ${employee.nameFirst}`:''}</h1><p>Pick a section below to get started.</p></div></div>
<div class="home-grid">
{#each tiles as [name,blurb]}
<button type="button" class="tile" on:click={()=>navigate(name)}>
 <strong>{name}</strong>
 <span>{blurb}</span>
</button>
{/each}
</div>
