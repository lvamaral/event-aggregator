const { Client } = require('pg');

// Note: on a real application we wouldn't be hard coding env variables
const start = async () => {
  client = new Client({
    database: 'qdb',
    host: 'questdb',
    password: 'quest',
    port: 8812,
    user: 'admin',
  });
  await client.connect();
}

start()
  .then(() => console.log('Connected to DB'))
  .catch(console.error)

module.exports = {
  client
}

