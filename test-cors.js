async function testCors() {
    const SUPABASE_URL = 'https://efmibjyjngrmvndzdfgm.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbWlianlqbmdybXZuZHpkZmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTYzMTAsImV4cCI6MjA4NzUzMjMxMH0.xHNlHqLdxyDPrd4bzIrYoYAECmhTy16u92VlCZaLYk0';

    console.log('Testing Supabase GET ...');
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/consultations?select=*`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Body length:', text.length);
        console.log('Body preview:', text.substring(0, 100));
    } catch (e) {
        console.error(e);
    }
}
testCors();
