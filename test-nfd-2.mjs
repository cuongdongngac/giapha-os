import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uscqteoevmuldwaarheb.supabase.co';
const supabaseKey = 'sb_publishable_73L35vNEobfvuZ34M_bBtw_6XiM5HRl';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Query all persons and check their full_name and other_names for 'Gia' or 'Chi' or 'Giỏi' or 'Giời'
  const { data: all } = await supabase.from('persons').select('id, full_name, other_names');
  
  if (!all) return;
  
  const matches = all.filter(p => {
    const fn = (p.full_name || '').toLowerCase();
    const on = (p.other_names || '').toLowerCase();
    return fn.includes('gia') || fn.includes('chí') || fn.includes('chi') || fn.includes('giời') || fn.includes('giỏi') || 
           on.includes('gia') || on.includes('chí') || on.includes('chi') || on.includes('giời') || on.includes('giỏi');
  });

  for (const p of matches) {
    console.log(`ID: ${p.id}`);
    
    // Check full_name
    console.log(`  full_name:   "${p.full_name}"`);
    if (p.full_name) {
      console.log(`    is NFC: ${p.full_name === p.full_name.normalize('NFC')}`);
      console.log(`    is NFD: ${p.full_name === p.full_name.normalize('NFD')}`);
    }
    
    // Check other_names
    console.log(`  other_names: "${p.other_names}"`);
    if (p.other_names) {
      console.log(`    is NFC: ${p.other_names === p.other_names.normalize('NFC')}`);
      console.log(`    is NFD: ${p.other_names === p.other_names.normalize('NFD')}`);
    }
  }
}

test().catch(console.error);
