
#!/usr/bin/env node

const fetch = require('node-fetch');

const REPLIT_URL = 'https://your-repl-name.your-username.repl.co';
const RENDER_URL = 'https://your-app-name.onrender.com';

async function testOutageScenarios() {
  console.log('🧪 Testování záložních scénářů...\n');

  // Test 1: Simulace výpadku databáze
  console.log('1. 🔴 Simuluji výpadek databáze...');
  try {
    await fetch(`${REPLIT_URL}/api/admin/simulate-outage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outageType: 'database', duration: 10000 })
    });
    
    console.log('   ✅ Výpadek simulován');
    
    // Test dotazu na výzvy během výpadku
    const response = await fetch(`${REPLIT_URL}/api/quest-challenges`);
    const data = await response.json();
    console.log(`   📊 Výsledek: ${data.length} záložních výzev načteno`);
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
    await fetch(`${REPLIT_URL}/api/admin/simulate-outage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outageType: 'ai', duration: 5000 })
    });
    console.log('   ✅ AI výpadek simulován - fotky budou přijímány bez AI verifikace');
  } catch (error) {
    console.log(`   ❌ Chyba: ${error.message}`);
  }

  console.log('\n🏁 Test dokončen. Monitorujte aplikaci pro záložní chování.');
}

// Spustit pokud je soubor spuštěn přímo
if (require.main === module) {
  testOutageScenarios().catch(console.error);
}

module.exports = { testOutageScenarios };
