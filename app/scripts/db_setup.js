const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const format = require('pg-format');
const { client } = require('../db');

const migrate = async () => {
  // Clean up existing table if it exists
  await client.query(
    "DROP TABLE IF EXISTS events"
  );

  await client.query(
    "CREATE TABLE IF NOT EXISTS events (" +
    "    customer_id STRING, event_type STRING, transaction_id STRING, ts TIMESTAMP" +
    ") timestamp(ts) PARTITION BY DAY WITH maxUncommittedRows=20000, commitLag=5s;",
  );

  const rows = [];

  return fs.createReadStream(path.resolve(__dirname, 'data', 'events.csv'))
    .pipe(csv.parse({ headers: false }))
    .on('error', error => console.error(error))
    .on('data', async (row) => {
      rows.push(row);
    })
    .on('end', async () => {
      // Process in batches to speed up ingestion
      const batchSize = 1000;
      for (let i = 0; i < rows.length; i += batchSize) {
        await client.query(
          format('INSERT INTO events (customer_id, event_type, transaction_id, ts) VALUES %L',
          rows.slice(i, i + batchSize))
        );
      }

      await client.query("COMMIT");
    });
}

migrate()
.then(() => console.log('Migration complete'))
.catch(console.error)
