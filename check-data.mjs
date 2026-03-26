import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uscqteoevmuldwaarheb.supabase.co';
const supabaseKey = 'sb_publishable_73L35vNEobfvuZ34M_bBtw_6XiM5HRl';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: all } = await supabase.from('persons').select('id, full_name, other_names');
  
  if (!all) return;
  
  // Find all people with 'gia' and 'chi' in their names somehow.
  const regex = /gia.*chi/i;
  const regex2 = /chi.*gia/i;
  
  const matches = all.filter(p => {
    const fn = (p.full_name || '');
    const on = (p.other_names || '');
    const fnNFC = fn.normalize('NFC').toLowerCase();
    const fnNFD = fn.normalize('NFD').toLowerCase();
    const fnNoMarks = fnNFD.replace(/[\u0300-\u036f]/g, '');
    
    const onNFC = on.normalize('NFC').toLowerCase();
    const onNFD = on.normalize('NFD').toLowerCase();
    const onNoMarks = onNFD.replace(/[\u0300-\u036f]/g, '');

    return (fnNoMarks.includes('gia') && fnNoMarks.includes('chi')) ||
           (onNoMarks.includes('gia') && onNoMarks.includes('chi'));
  });

  console.log(`Found ${matches.length} possible matches for Gia + Chi.`);
  
  for (const p of matches) {
    console.log(`ID: ${p.id}, FN: "${p.full_name}", ON: "${p.other_names}"`);
    if (p.full_name) {
       console.log(`  FN Char codes:`, Array.from(p.full_name).map(c => c.charCodeAt(0).toString(16)).join(' '));
    }
  }

  // Also check if there are non-NFC names
  const nonNfc = all.filter(p => {
    const fn = p.full_name || '';
    const on = p.other_names || '';
    return fn !== fn.normalize('NFC') || on !== on.normalize('NFC');
  });
  console.log(`\nFound ${nonNfc.length} records with non-NFC characters.`);
  for (const p of nonNfc.slice(0, 10)) {
     console.log(`  ID: ${p.id}, FN: "${p.full_name}", ON: "${p.other_names}"`);
  }
}

test().catch(console.error);
