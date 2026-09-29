import { hindsightService } from '../services/hindsight.service.js';
import { agentRuntime } from '../agents/agent.runtime.js';
import { getDb } from '../db.js';

async function runTests() {
  console.log('\n==================================================');
  console.log('  RUNNING MEMORA & HINDSIGHT VERIFICATION TESTS');
  console.log('==================================================\n');

  const projectId = 'test-verification-project';
  const bankId = `project:${projectId}`;

  // Reset test bank
  await hindsightService.clearBank(bankId);

  try {
    // TEST 1: Agent A (Groq) Retains -> Agent B (Gemini) Recalls
    console.log('[TEST 1] Groq retains PostgreSQL architectural decision...');
    await agentRuntime.processMessage(
      projectId,
      'groq',
      'We decided to use PostgreSQL for transactional data because strong consistency is critical. Remember this architectural decision.'
    );

    console.log('[TEST 1] Gemini asks about database choice...');
    const geminiResp = await agentRuntime.processMessage(
      projectId,
      'gemini',
      'What database should we use for the transactional part of this project?'
    );

    const geminiRecalledPostgres = geminiResp.recalledMemories?.some((m) =>
      m.content.toLowerCase().includes('postgresql')
    );

    if (geminiRecalledPostgres) {
      console.log('✅ TEST 1 PASSED: Gemini successfully recalled Groq\'s PostgreSQL decision via Hindsight!');
    } else {
      throw new Error('TEST 1 FAILED: Gemini did not recall PostgreSQL decision.');
    }

    // TEST 2: Gemini Retains Lesson -> GPT Recalls Lesson
    console.log('\n[TEST 2] Gemini retains Redis caching timeout failure...');
    await agentRuntime.processMessage(
      projectId,
      'gemini',
      'We tried Redis caching for endpoint X and it caused timeout issues under load. Remember that we should avoid that approach here.'
    );

    console.log('[TEST 2] GPT asks about caching approaches to avoid...');
    const gptResp = await agentRuntime.processMessage(
      projectId,
      'gpt',
      'What caching approach should we avoid for endpoint X?'
    );

    const gptRecalledRedis = gptResp.recalledMemories?.some((m) =>
      m.content.toLowerCase().includes('redis')
    );

    if (gptRecalledRedis) {
      console.log('✅ TEST 2 PASSED: GPT successfully recalled Gemini\'s Redis lesson via Hindsight!');
    } else {
      throw new Error('TEST 2 FAILED: GPT did not recall Redis lesson.');
    }

    // TEST 3: Reflection Test ("Ask Team Memory")
    console.log('\n[TEST 3] Testing Hindsight REFLECT (Ask Team Memory)...');
    const reflectRes = await hindsightService.reflect(bankId, 'What has the team learned about architecture?');
    
    if (reflectRes.supportingMemories.length >= 2) {
      console.log('✅ TEST 3 PASSED: Hindsight Reflect synthesized across', reflectRes.supportingMemories.length, 'team memories!');
      console.log('   Synthesis Output:\n', reflectRes.answer.substring(0, 150) + '...');
    } else {
      throw new Error('TEST 3 FAILED: Hindsight Reflect failed to group supporting memories.');
    }

    // TEST 4: Cross-Session Persistence Verification
    console.log('\n[TEST 4] Testing Cross-Session Persistence in DB...');
    const db = await getDb();
    const storedMemories = await db.all('SELECT * FROM hindsight_memories WHERE bankId = ?', [bankId]);
    if (storedMemories.length >= 2) {
      console.log('✅ TEST 4 PASSED: Persistent SQLite table contains', storedMemories.length, 'durable memory records!');
    } else {
      throw new Error('TEST 4 FAILED: Cross-session database records missing.');
    }

    console.log('\n==================================================');
    console.log('  ALL 4 HINDSIGHT VERIFICATION TESTS PASSED SUCCESSFULLY!  ');
    console.log('==================================================\n');

  } catch (err: any) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    // Cleanup test bank
    await hindsightService.clearBank(bankId);
  }
}

runTests();
