require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const realtime = require('./services/realtime');

const authRoutes = require('./routes/authRoutes');
const alertRoutes = require('./routes/alertRoutes');
const eventRoutes = require('./routes/eventRoutes');
const assetRoutes = require('./routes/assetRoutes');
const ruleRoutes = require('./routes/ruleRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const blockRoutes = require('./routes/blockRoutes');
const geoRoutes = require('./routes/geoRoutes');
const playbookRoutes = require('./routes/playbookRoutes');
const sigmaRoutes = require('./routes/sigmaRoutes');
const reportRoutes = require('./routes/reportRoutes');
const systemRoutes = require('./routes/systemRoutes');
const syslogListener = require('./services/ingestion/syslogListener');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ONLINE', service: 'ForgeSOC API', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/blocklist', blockRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/playbooks', playbookRoutes);
app.use('/api/sigma', sigmaRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/system', systemRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

// Wrap the Express app in a raw HTTP server so Socket.IO can share the same port
const httpServer = http.createServer(app);
realtime.init(httpServer);

const start = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`🛡️  ForgeSOC API running on port ${PORT} (HTTP + WebSocket)`);
  });
  if (process.env.ENABLE_SYSLOG_INGESTION !== 'false') {
    syslogListener.start(); // real UDP syslog listener — see services/ingestion/syslogListener.js
  }
};

start();

module.exports = app;

