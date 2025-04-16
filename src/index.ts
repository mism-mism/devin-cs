import express from 'express';
import dotenv from 'dotenv';
import { lineRouter } from './controllers/lineController';
import { mockMcpRouter } from './controllers/mockMcpController';
import { slackRouter } from './controllers/slackController';

// Load environment variables
dotenv.config();

// Create Express server
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/webhook/line', lineRouter);
app.use('/mock-mcp', mockMcpRouter);
app.use('/slack', slackRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});


// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
