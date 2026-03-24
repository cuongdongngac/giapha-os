import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uscqteoevmuldwaarheb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzY3F0ZW9ldm11bGR3YWFyaGViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI4Nzg2MiwiZXhwIjoyMDg3ODYzODYyfQ.-jaNuaF0NC4Yqnzkup5sp4TIKL7tkOnwkbj9L37E3RA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { count: personsCount } = await supabase.from('persons').select('*', { count: 'exact', head: true });
  const { count: relsCount } = await supabase.from('relationships').select('*', { count: 'exact', head: true });
  
  console.log('Total persons:', personsCount);
  console.log('Total relationships:', relsCount);
}

main();
