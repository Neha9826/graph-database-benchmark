const neo4j = require('neo4j-driver');
const fs = require('fs');
require('dotenv').config();

const driver = neo4j.driver(
  process.env.COGNODB_URI,
  neo4j.auth.basic(process.env.COGNODB_USER, process.env.COGNODB_PASSWORD)
);

const BATCH_SIZE = 2000; 

async function loadData() {
  const session = driver.session();
  
  console.log("Reading file into memory...");
  const fileContent = fs.readFileSync('cit-HepPh.txt', 'utf-8');
  const lines = fileContent.split('\n');
  
  let batch = [];
  let totalRelationships = 0;
  
  console.log("Starting data ingestion...");
  const startTime = performance.now();

  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;

    const parts = line.split('\t');
    if (parts.length >= 2) {
      batch.push({ from: parts[0].trim(), to: parts[1].trim() });
    }

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(session, batch);
      totalRelationships += batch.length;
      console.log(`Inserted ${totalRelationships} relationships...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertBatch(session, batch);
    totalRelationships += batch.length;
    console.log(`Inserted ${totalRelationships} relationships...`);
  }

  const totalTimeMs = performance.now() - startTime;
  const totalTimeSec = totalTimeMs / 1000;
  
  console.log(`\n--- INGESTION COMPLETE ---`);
  console.log(`Total Wall-Clock Time: ${totalTimeSec.toFixed(2)} seconds`);
  console.log(`Relationships per second: ${(totalRelationships / totalTimeSec).toFixed(2)}`);
  
  await session.close();
  await driver.close();
}

async function insertBatch(session, batch) {
  const query = `
    UNWIND $batch AS row
    MERGE (a:Paper {id: row.from})
    MERGE (b:Paper {id: row.to})
    MERGE (a)-[:CITES]->(b)
  `;
  await session.run(query, { batch });
}

loadData();