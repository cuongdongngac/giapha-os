import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uscqteoevmuldwaarheb.supabase.co';
const supabaseKey = 'sb_publishable_73L35vNEobfvuZ34M_bBtw_6XiM5HRl';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const targetId = 'e63a60cd-c8c2-4952-8663-7b97a863c47f';
  
  // Direct fetch
  const { data: direct } = await supabase.from('persons').select('id, full_name, birth_year').eq('id', targetId).single();
  console.log('Direct fetch result:', direct);

  // Simulated fetchAll
  let allData = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    let query = supabase.from('persons').select('id, full_name, birth_year').range(page * pageSize, (page + 1) * pageSize - 1);
    query = query.order('birth_year', { ascending: true, nullsFirst: false });
    
    const { data, error } = await query;
    if (error) {
      console.error('Error:', error);
      break;
    }
    if (data && data.length > 0) {
      allData = [...allData, ...data];
      if (data.length < pageSize) break;
    } else {
      break;
    }
    page++;
  }
  
  const found = allData.find(p => p.id === targetId);
  console.log(`Total fetched: ${allData.length}`);
  console.log(`Target found in fetchAll?:`, found);
  
  // Proper fetchAll (with secondary id sort)
  let allDataFixed = [];
  page = 0;
  while (true) {
    let query = supabase.from('persons').select('id, full_name, birth_year').range(page * pageSize, (page + 1) * pageSize - 1);
    query = query.order('birth_year', { ascending: true, nullsFirst: false }).order('id', { ascending: true });
    
    const { data, error } = await query;
    if (error) break;
    if (data && data.length > 0) {
      allDataFixed = [...allDataFixed, ...data];
      if (data.length < pageSize) break;
    } else {
      break;
    }
    page++;
  }
  
  const foundFixed = allDataFixed.find(p => p.id === targetId);
  console.log(`Total fetched (Fixed): ${allDataFixed.length}`);
  console.log(`Target found in fixed fetchAll?:`, foundFixed);
  
  if (allData.length !== allDataFixed.length) {
    console.log(`MISSING ROWS: The buggy query fetched ${allData.length} rows while the fixed query fetched ${allDataFixed.length} rows.`);
  }

}

test().catch(console.error);
