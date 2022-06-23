const express = require('express');
const router = express.Router();

// TODO
/* GET customer aggregated events */
router.get('/:id/total_events', (req, res, next) => {
  // Check id
  // Check start_at
  // Check end_before
  res.send('new one!');
});

module.exports = router;
