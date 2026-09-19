import { databaseStatus } from '../config/database.js';

export const root = (_request, response) => response.json({
  message: 'Ledger API is running',
  docs: '/health',
});

export const health = (_request, response) => response.json({
  status: 'ok',
  database: databaseStatus(),
});
