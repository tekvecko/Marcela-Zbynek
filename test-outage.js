
const fetch = require('node-fetch');

const REPLIT_URL = 'https://svatebni-fotovyzvy.zbkocian.repl.co';
const RENDER_URL = 'https://your-app-name.onrender.com';

async function testOutageScenarios() {
  console.log('🧪 Testování záložních scénářů...\n');

  // Test 1: Simulace výpadku databáze
  console.log('1. 🔴 Simuluji výpadek databáze...');
  try {
    const response = await fetch(`${REPLIT_URL}/api/admin/simulate-outage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outageType: 'database', duration: 10000 })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Výpadek simulován:', data.message);
      
      // Test dotazu na výzvy během výpadku
      await new Promise(resolve => setTimeout(resolve, 1000));
      const challengesResponse = await fetch(`${REPLIT_URL}/api/quest-challenges`);
      const challengesData = await challengesResponse.json();
      console.log(`   📊 Výsledek: ${challengesData.length || 0} záložních výzev načteno`);
    } else {
      console.log(`   ❌ HTTP Error: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Chyba: ${error.message}`);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Zkouška Render zálohy
  console.log('\n2. 🟢 Testuji Render záložní systém...');
  try {
    const healthResponse = await fetch(`${RENDER_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`   ✅ Render health check: ${healthData.status}`);
    
    const challengesResponse = await fetch(`${RENDER_URL}/api/quest-challenges`);
    const challengesData = await challengesResponse.json();
    console.log(`   📊 Render výzvy: ${challengesData.length} dostupných`);
  } catch (error) {
    console.log(`   ❌ Render nedostupný: ${error.message}`);
  }

  // Test 3: Simulace AI výpadku
  console.log('\n3. 🔴 Simuluji výpadek AI služby...');
  try {
    const response = await fetch(`${REPLIT_URL}/api/admin/simulate-outage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outageType: 'ai', duration: 5000 })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ AI výpadek simulován - fotky budou přijímány bez AI verifikace');
    } else {
      console.log(`   ❌ HTTP Error: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Chyba: ${error.message}`);
  }

  console.log('\n🏁 Test dokončen. Monitorujte aplikaci pro záložní chování.');
}

// Spustit pokud je soubor spuštěn přímo
testOutageScenarios().catch(console.error);
