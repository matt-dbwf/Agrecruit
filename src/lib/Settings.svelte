<script>
 export let employee; export let navigate;
 const tiles=[['Industries','Maintain the Industries list.'],['Skills','Maintain the Skills list.'],['Licenses','Maintain the Licenses list.'],['Education','Maintain the Education list.']];
 $: allTiles=[...tiles,...(employee?.flag_Manager?[['Employees','Manage staff access and Manager permissions.']]:[])];
</script>
<div class="toolbar"><div><button class="text" on:click={()=>navigate('Home')}>← Home</button><h1>Settings</h1><p>Manage reference data used across the app.</p></div></div>
<div class="home-grid">
{#each allTiles as [name,blurb]}
<button type="button" class="tile" on:click={()=>navigate(name)}>
 <strong>{name}</strong>
 <span>{blurb}</span>
</button>
{/each}
</div>
