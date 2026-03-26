import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uscqteoevmuldwaarheb.supabase.co';
const supabaseKey = 'sb_publishable_73L35vNEobfvuZ34M_bBtw_6XiM5HRl';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: all } = await supabase.from('persons').select('id, full_name, other_names');
  
  if (!all) return;
  
  const badSpacing = all.filter(p => {
    const fn = (p.full_name || '');
    const on = (p.other_names || '');
    
    const hasBadSpaces = (str) => {
        return str.startsWith(' ') || 
               str.endsWith(' ') || 
               str.includes('  ') || 
               str.includes('\n') || 
               str.includes('\t') ||
               str.includes('\r');
    };
    
    return hasBadSpaces(fn) || hasBadSpaces(on);
  });

  console.log(`Found ${badSpacing.length} records with bad internal/external spacing or newlines.`);
  
  for (const p of badSpacing.slice(0, 20)) {
    console.log(`ID: ${p.id}`);
    if (p.full_name !== (p.full_name||'').trim().replace(/\s+/g, ' ')) {
       console.log(`  BAD FN: ${JSON.stringify(p.full_name)}`);
    }
    if (p.other_names && p.other_names !== p.other_names.trim().replace(/\s+/g, ' ')) {
       console.log(`  BAD ON: ${JSON.stringify(p.other_names)}`);
    }
  }

  // Create update script logic to clean these up if needed?
}

test().catch(console.error);
