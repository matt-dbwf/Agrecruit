import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export async function employeeAction(action, values) {
  const { data, error } = await supabase.functions.invoke('employees', { body: { action, ...values } });
  if (error) {
    let message = error.message;
    try { message = (await error.context.json()).error || message; } catch {}
    throw new Error(message);
  }
  if (data.error) throw new Error(data.error);
  return data.employee;
}
export function searchText(value) { return value.replace(/[,%().*\\]/g, ' ').trim().slice(0, 100); }
