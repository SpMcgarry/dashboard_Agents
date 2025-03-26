import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { workspaceRoutes } from './routes/workspace';
import { agentRoutes } from './routes/agent';
import { groupRoutes } from './routes/group';
import { chatRoutes } from './routes/chat';
import { promptRoutes } from './routes/prompt';
import testRoutes from './routes/test';
import { authenticateToken } from './middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to AI Agent Framework API' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test AI route (no authentication required)
app.use('/api/test', testRoutes);

// Protected routes
app.use('/api/workspaces', authenticateToken, workspaceRoutes);
app.use('/api/agents', authenticateToken, agentRoutes);
app.use('/api/groups', authenticateToken, groupRoutes);
app.use('/api/chats', authenticateToken, chatRoutes);
app.use('/api/prompts', authenticateToken, promptRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Health check available at: http://localhost:${port}/health`);
  console.log(`Test AI endpoint available at: http://localhost:${port}/api/test/test-ai`);
}); 