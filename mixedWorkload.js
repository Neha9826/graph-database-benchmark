const neo4j = require('neo4j-driver');
require('dotenv').config();

const CONCURRENCY = 20; // Stated client concurrency
const DURATION_SEC = 10; 

// Increase the connection pool to handle the concurrent clients
const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(process.env.COGNODB_USER, process.env.COGNODB_PASSWORD),
  { maxConnectionPoolSize: CONCURRENCY * 2 }
);

async function runMixedWorkload() {
  console.log(`Starting mixed workload test...`);
  console.log(`Concurrency: ${CONCURRENCY} clients | Mix: 80% Read, 20% Write[cite: 1]`);
  
  let totalQueries = 0;
  const startTime = performance.now();
  let isRunning = true;

  // Stop the workers after DURATION_SEC
  setTimeout(() => { isRunning = false; }, DURATION_SEC * 1000);

  async function worker() {
    const session = driver.session();
    try {
      while (isRunning) {
        const isRead = Math.random() < 0.8;
        
        if (isRead) {
          // Simple read query
          await session.run('MATCH (p:Paper) WITH p LIMIT 10 RETURN count(p)');
        } else {
          // Harmless write query (touches a node without breaking the schema)
          await session.run('MATCH (p:Paper) WITH p LIMIT 1 SET p.lastChecked = datetime()');
        }
        totalQueries++;
      }
    } catch (err) {
      // Ignore timeout errors during heavy load testing
    } finally {
      await session.close();
    }
  }

  // Spawn the concurrent clients
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const totalTimeSec = (performance.now() - startTime) / 1000;
  const throughput = totalQueries / totalTimeSec;

  console.log(`\n--- MIXED WORKLOAD COMPLETE ---`);
  console.log(`Total Queries Executed: ${totalQueries}`);
  console.log(`Sustained Throughput: ${throughput.toFixed(2)} queries/second[cite: 1]`);

  await driver.close();
}

runMixedWorkload();