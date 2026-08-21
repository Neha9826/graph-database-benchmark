const { FalkorDB } = require('falkordb');
require('dotenv').config();

async function testConnection() {
  try {
    const client = await FalkorDB.connect({
      socket: {
        host: process.env.FALKOR_HOST,
        port: parseInt(process.env.FALKOR_PORT),
      },
      password: process.env.FALKOR_PASSWORD
    });
    const db = client.selectGraph('benchmark');
    const result = await db.query('RETURN "FalkorDB Connection Successful!" AS message');
    console.log(result.data[0][0]);
    await client.close();
  } catch (error) {
    console.error("Connection failed:", error);
  }
}

testConnection();