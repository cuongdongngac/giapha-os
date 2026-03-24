import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uscqteoevmuldwaarheb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzY3F0ZW9ldm11bGR3YWFyaGViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI4Nzg2MiwiZXhwIjoyMDg3ODYzODYyfQ.-jaNuaF0NC4Yqnzkup5sp4TIKL7tkOnwkbj9L37E3RA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const targetId = '50996cda-f09b-4d5d-876f-f31516e8545c';
  
  const { data: rels } = await supabase
    .from('relationships')
    .select('*')
    .or(`person_a.eq.${targetId},person_b.eq.${targetId}`);
    
  console.log('Relationships (Service Role):', rels);
}

main();
