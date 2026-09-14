import { createClient } from 'npm:@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const reply = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
Deno.serve(async (req) => {
 if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
 if (req.method !== 'POST') return reply({error:'Method not allowed'},405);
 const db = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 try {
 const token = req.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
 if(!token) return reply({error:'Sign in required'},401);
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user) return reply({error:'Session expired. Please sign in.'},401);
 const {data:caller,error:callerError}=await db.from('Employees').select('id,flag_Manager').eq('id_User',user.id).single();
 if(callerError||!caller?.flag_Manager) return reply({error:'Manager access required'},403);
 const input=await req.json();
 if(!['save','create-user'].includes(input.action)) return reply({error:'Unknown action'},400);
 let employee:any=null;
 if(input.id){const result=await db.from('Employees').select('*').eq('id',input.id).single();if(result.error) return reply({error:'Employee not found'},404);employee=result.data;}
 if(input.action==='create-user'){
 if(!employee||employee.id_User) return reply({error:'Employee must exist without a User account'},409);
 const email=String(input.email||'').trim();const password=String(input.password||'');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({error:'Enter a valid login email'},400);
 if(password.length<12||!/[a-z]/.test(password)||!/[A-Z]/.test(password)||!/[0-9]/.test(password)||! /[^A-Za-z0-9]/.test(password)) return reply({error:'Password needs 12 characters, uppercase, lowercase, number and symbol'},400);
 const {data,error}=await db.auth.admin.createUser({email,password,email_confirm:true,app_metadata:{employee_id:employee.id,manager:input.flag_Manager===true},user_metadata:{employee_id:employee.id,nameFirst:employee.nameFirst,nameLast:employee.nameLast}});
 if(error) throw error;
 const linked=await db.from('Employees').select('*').eq('id',employee.id).eq('id_User',data.user.id).single();
 if(linked.error){const rollback=await db.auth.admin.deleteUser(data.user.id);if(rollback.error) return reply({error:'Account association failed; administrator must remove the unlinked Auth account.'},500);throw new Error('Account association failed; new account removed');}
 return reply({employee:linked.data});
 }
 const nameFirst=String(input.nameFirst||'').trim(),nameLast=String(input.nameLast||'').trim();
 if(!nameFirst||!nameLast) return reply({error:'First Name and Last Name are required'},400);
 const email=String(input.email||'').trim()||null;
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({error:'Enter a valid email'},400);
 const values={nameFirst,nameLast,email,flag_Manager:employee?input.flag_Manager===true:false};
 if(employee?.id===caller.id&&!values.flag_Manager) return reply({error:'You cannot remove your own Manager access'},400);
 // Save names/permissions first. Auth email trigger then keeps email synchronized,
 // including when an Auth administrator changes email outside this application.
 if(employee?.id_User){
 if(!email) return reply({error:'An Employee with a User account requires an email'},400);
 const {error}=await db.from('Employees').update({nameFirst,nameLast,flag_Manager:values.flag_Manager}).eq('id',employee.id);if(error) throw error;
 if(email!==employee.email){const changed=await db.auth.admin.updateUserById(employee.id_User,{email});if(changed.error){await db.from('Employees').update({nameFirst:employee.nameFirst,nameLast:employee.nameLast,flag_Manager:employee.flag_Manager}).eq('id',employee.id);throw changed.error;}}
 }else{
 const result=employee?await db.from('Employees').update(values).eq('id',employee.id):await db.from('Employees').insert(values).select().single();
 if(result.error) throw result.error;
 if(!employee) return reply({employee:result.data});
 }
 const result=await db.from('Employees').select('*').eq('id',employee.id).single();if(result.error) throw result.error;
 return reply({employee:result.data});
 }catch(error){return reply({error:error instanceof Error?error.message:'Request failed'},400);}
});
