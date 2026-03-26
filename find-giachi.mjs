import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uscqteoevmuldwaarheb.supabase.co';
const supabaseKey = 'sb_publishable_73L35vNEobfvuZ34M_bBtw_6XiM5HRl';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: direct } = await supabase.from('persons').select('id, full_name, other_names, is_deceased').ilike('full_name', '%gia%');
  console.log('People with Gia:', direct?.filter(p => (p.full_name || '').toLowerCase().includes('chí') || (p.full_name || '').toLowerCase().includes('chi')));
  
  const { data: direct2 } = await supabase.from('persons').select('id, full_name, other_names, is_deceased').ilike('other_names', '%gia%');
  console.log('People with Gia in other_names:', direct2?.filter(p => (p.other_names || '').toLowerCase().includes('chí') || (p.other_names || '').toLowerCase().includes('chi')));
}

test().catch(console.error);
