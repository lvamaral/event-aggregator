const express = require('express');
const router = express.Router();

const { client } = require('../db');

// GET customer aggregated events
router.get('/:id/total_events', async (req, res) => {
  const { starting_at, ending_before } = req.query;
  const customerId = req.params.id;

  // We need to clear the cache to avoid a bug with QuestDB that can lead to unpredictable results
  await client.query('select flush_query_cache();')

  const query = {
    name: 'fetch events',
    text: `SELECT month(ts) as month, day(ts) as day, hour(timestamp_floor('h', ts)) as hour_start, hour(timestamp_ceil('h', ts)) as hour_end, count() FROM events WHERE customer_id = $1 AND ts >= to_timestamp($2) AND ts < to_timestamp($3)`,
    values: [
      customerId,
      starting_at ? starting_at : '2020-01-01 00:00:00',
      ending_before ? ending_before : '3000-01-01 00:00:00' // Date defaults in case none are passed in to simplify query logic
    ]
  }

  let dbResponse;

  try {
    dbResponse = await client.query(query);

    console.log(dbResponse);
  } catch (error) {
    // In production we'd have better error handling
    console.error(error.stack)
    res.status(500).send('Something broke!')
  }

  res.json(dbResponse.rows);
});

module.exports = router;
