const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(process.env.COGNODB_USER, process.env.COGNODB_PASSWORD)
);

const ITERATIONS = 100;

function calculatePercentiles(latencies) {
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.50)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  return { p50, p95 };
}

async function runQuery(session, query, params = {}) {
  const latencies = [];
  
  // Warm-up run (not recorded)
  await session.run(query, params);
  
  // 100 recorded iterations[cite: 1]
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    await session.run(query, params);
    latencies.push(performance.now() - start);
  }
  return calculatePercentiles(latencies);
}

async function runBenchmark() {
  const session = driver.session();
  console.log(`Running benchmarks (${ITERATIONS} iterations) after warm-up...\n`);

  try {
    // Fetch a random valid paper ID to use as a starting point
    const randRes = await session.run('MATCH (p:Paper) WITH p LIMIT 1000 WITH collect(p.id) AS ids RETURN ids[toInteger(rand() * 1000)] AS randId');
    const startId = randRes.records[0].get('randId');
    console.log(`Using Node ID [${startId}] as traversal anchor.\n`);

    // 1. Point Lookup (Indexed)[cite: 1]
    const lookupStats = await runQuery(session, 'MATCH (p:Paper {id: $startId}) RETURN p', { startId });
    console.log(`Point Lookup          - p50: ${lookupStats.p50.toFixed(2)}ms | p95: ${lookupStats.p95.toFixed(2)}ms`);

    // 2. Traversals (1, 2, and 3-hop)[cite: 1]
    const hop1Stats = await runQuery(session, 'MATCH (p:Paper {id: $startId})-[:CITES]->(a) RETURN count(a)', { startId });
    console.log(`1-Hop Traversal       - p50: ${hop1Stats.p50.toFixed(2)}ms | p95: ${hop1Stats.p95.toFixed(2)}ms`);

    const hop2Stats = await runQuery(session, 'MATCH (p:Paper {id: $startId})-[:CITES*2]->(a) RETURN count(a)', { startId });
    console.log(`2-Hop Traversal       - p50: ${hop2Stats.p50.toFixed(2)}ms | p95: ${hop2Stats.p95.toFixed(2)}ms`);

    const hop3Stats = await runQuery(session, 'MATCH (p:Paper {id: $startId})-[:CITES*3]->(a) RETURN count(a)', { startId });
    console.log(`3-Hop Traversal       - p50: ${hop3Stats.p50.toFixed(2)}ms | p95: ${hop3Stats.p95.toFixed(2)}ms`);

    // 3. Aggregation (Count/Group-by)[cite: 1]
    const aggStats = await runQuery(session, 'MATCH (p:Paper)-[:CITES]->(a) RETURN p.id, count(a) AS outDegree ORDER BY outDegree DESC LIMIT 10');
    console.log(`Aggregation (Group)   - p50: ${aggStats.p50.toFixed(2)}ms | p95: ${aggStats.p95.toFixed(2)}ms`);

  } catch (err) {
    console.error("Benchmark failed:", err);
  } finally {
    await session.close();
    await driver.close();
  }
}

runBenchmark();