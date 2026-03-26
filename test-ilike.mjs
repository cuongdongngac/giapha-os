import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uscqteoevmuldwaarheb.supabase.co';
const supabaseKey = 'sb_publishable_73L35vNEobfvuZ34M_bBtw_6XiM5HRl';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const searchTerm1 = '%gia chí%'; // lowercase
  const searchTerm2 = '%Gia Chí%'; // exact case
  
  console.log(`Testing search term: "${searchTerm1}"`);
  const { data: q1 } = await supabase.from('persons')
    .select('id, full_name, other_names')
    .or(`full_name.ilike.${searchTerm1},other_names.ilike.${searchTerm1}`);
    
  console.log(`Found ${q1?.length || 0} matches using lowercase query.`);
  
  console.log(`Testing search term: "${searchTerm2}"`);
  const { data: q2 } = await supabase.from('persons')
    .select('id, full_name, other_names')
    .or(`full_name.ilike.${searchTerm2},other_names.ilike.${searchTerm2}`);
    
  console.log(`Found ${q2?.length || 0} matches using exact case query.`);
  
  if (q1?.length !== q2?.length) {
     console.log('PostgreSQL ilike does NOT handle Vietnamese diacritics case-insensitivity properly!');
  } else {
     console.log('PostgreSQL ilike handles case properly.');
  }

  // Also test removing diacritics (unaccent)
  // Usually full text search is used 'fts' or we have to normalize the query and text for text search.
}

test().catch(console.error);
