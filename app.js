const express = require('express');
const app = express();
const port = 3000;

const eventsRouter = require('./routes/events');

// Register Routes
app.use('/events', eventsRouter);

//Launch listening server on port 3000
app.listen(port, () => {
  console.log('app listening on port ${port}!');
});
