const express = require('express');
const app = express();
const port = 3000;
const customerRouter = require('./app/routes/customers');

// Configure App
app.use(express.json());

// Register Routes
app.use('/v1/customers', customerRouter);
// Basic catch-all for bad routes
app.use((req, res) => {
  res.status(404).send('Route not found!');
});

// Launch on specified port
app.listen(port, () => {
  console.log(`app listening on port ${port}!`);
});
