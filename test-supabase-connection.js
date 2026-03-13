const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iszvepiattpqlvorovpr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpa3B6bHpjcXF3dGxxZnhsY2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MjM0ODAsImV4cCI6MjA4Nzk5OTQ4MH0.oTSG2Azp7teT-bekhz8gwV13JLoFwsHSyP5rCuFzMyY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Simple select
    const { data: testData, error: testError } = await supabase
      .from('registrations')
      .select('id, status')
      .limit(1);
    
    console.log('Test 1 - Simple select:', { testData, testError });
    
    // Test 2: Select with status filter
    const { data: filterData, error: filterError } = await supabase
      .from('registrations')
      .select('*')
      .in('status', ['pending', 'confirmed'])
      .limit(3);
    
    console.log('Test 2 - With status filter:', { filterData, filterError });
    
    // Test 3: Join with workshops
    const { data: joinData, error: joinError } = await supabase
      .from('registrations')
      .select(`
        id,
        status,
        full_name,
        workshops(name)
      `)
      .in('status', ['pending', 'confirmed'])
      .limit(2);
    
    console.log('Test 3 - With workshops join:', { joinData, joinError });
    
  } catch (error) {
    console.error('Connection test failed:', error);
  }
}

testConnection();