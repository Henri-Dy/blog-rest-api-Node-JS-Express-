require('dotenv').config();
const app    = require('./src/app');
const { initializeDatabase } = require('./src/database/db');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await initializeDatabase();
    logger.info('✅ Database initialized');
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('❌ Failed to start:', err);
    process.exit(1);
  }
}

start();