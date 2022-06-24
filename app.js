const express = require('express');
const app = express();
const customerRouter = require('./app/routes/customers');

const PORT = 3000;
const HOST = '0.0.0.0';

// Configure App
app.use(express.json());

// Register Routes
app.use('/v1/customers', customerRouter);
// Basic catch-all for bad routes
app.use((req, res) => {
  res.status(404).send('Route not found!');
});

// Launch on specified port
app.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});
