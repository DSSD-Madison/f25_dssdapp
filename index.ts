import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';

// Import our modules
import { initializeFirebase } from './config/firebase.js';
import { initializeSendGrid, isEmailEnabled } from './services/mail.js'; 
import { applicationLimiter } from './middleware/rateLimiter.js';
import applicationRoutes from './routes/application.js';

// Load environment variables
dotenv.config();

// Environment configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const PORT = process.env.PORT || 8080;

console.log(`Starting API in ${isDevelopment ? 'development' : 'production'} mode`);

// Initialize services
const db = initializeFirebase();

// Initialize SendGrid (non-blocking)
(async () => {
  await initializeSendGrid();
})().catch(error => {
  console.error('SendGrid initialization failed:', error);
});

// Initialize Express app
const app = express();
app.set('trust proxy', 1);
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: isDevelopment ? 'development' : 'production',
    emailEnabled: isEmailEnabled()
  });
});

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});


// Apply rate limiter and routes
app.use('/apply', applicationLimiter, applicationRoutes);

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});