const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const logger = require('./logger');

const app = express();
app.use(bodyParser.json());

// Enable CORS for development (allow requests from the frontend dev server)
app.use((req, res, next) => {
  const origin = process.env.CORS_ORIGIN || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  // Allow common methods and respond to preflight
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => {
  res.send('RFP Management Backend is running');
}   );

app.use('/api/rfps', require('./routes/rfps'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/proposals', require('./routes/proposals'));
app.use('/api/send-rfp', require('./routes/send'));

// health
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log("Hello ******************")
  logger.info(`RFP backend listening on port ${PORT}`);
});
