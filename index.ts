// Import required modules
import express from 'express';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Load environment variables
dotenv.config();

// Environment configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const PORT = process.env.PORT || 8080;

console.log(`Starting API in ${isDevelopment ? 'development' : 'production'} mode`);

// Firebase configuration
const serviceAccountPath = isDevelopment
  ? './certs/oa-madison-firebase-adminsdk-tr5iw-80ae5b92fb.json'
  : '/etc/secrets/oa-madison-firebase-adminsdk-tr5iw-80ae5b92fb.json';

initializeApp({
  credential: cert(require(serviceAccountPath)),
});

const db = getFirestore();

// Initialize Express application
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

// Apply rate limiter to the API endpoint
app.use('/apply', limiter);

// Routes
app.get('/', (req : any, res : any) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

interface ApplicationData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  year: number;
  why_do_you_want_to_join: string;
  urls: string[];
}

interface UpdateData {
  applicationId: string;
  applicationData: ApplicationData ;
}

// API endpoint for handling POST requests
app.post('/apply', async (req : any, res : any) => {

  const { 
    first_name, 
    last_name, 
    email, 
    phone_number, 
    year, 
    why_do_you_want_to_join,
    urls 
  }: ApplicationData = req.body;
  
  // Validate request body
  if (!first_name || !last_name || !email || !phone_number || !year || why_do_you_want_to_join || !urls) {
    return res.status(400).json({ error: 'Invalid request. All fields are required.', errorType: 'INVALID_REQUEST'});
  }

  // Add the data to the database
  try {
    const docRef = await db.collection('applications').add({
      first_name,
      last_name,
      email,
      phone_number,
      year,
      urls,
      why_do_you_want_to_join,
      timestamp: new Date()
    });
    console.log(docRef)
    return res.status(200).json({ message: 'Application submitted successfully', "applicationId": docRef.id });
  } 
  catch (error) {
    console.error('Error submitting application:', error);
    return res.status(500).json({ error: 'DATABASE_ERROR' });
  }
});

app.patch('/apply', async (req : any, res : any) => {
  const { 
    applicationId,
    applicationData
  }: UpdateData = req.body;

  // Validate request body
  if (!applicationId || !applicationData) {
    return res.status(400).json({ error: 'Invalid request. All fields are required.', errorType: 'INVALID_REQUEST'});
  }

  // Add the data to the database
  try {
    await db.collection('applications').doc(applicationId).set({
      first_name: applicationData.first_name,
      last_name: applicationData.last_name,
      email: applicationData.email,
      phone_number: applicationData.phone_number,
      year: applicationData.year,
      urls: applicationData.urls,
      timestamp: new Date()
    }, { merge: true });

    return res.status(200).json({ message: 'Application updated successfully', "applicationId": applicationId });
  } 
  catch (error) {
    console.error('Error updating application:', error);
    return res.status(500).json({ error: 'DATABASE_ERROR' });
  }
})

app.delete('/apply', async (req : any, res : any) => {
  const { applicationId } = req.body;

  // Validate request body
  if (!applicationId) {
    return res.status(400).json({ error: 'Invalid request. All fields are required.', errorType: 'INVALID_REQUEST'});
  }

  // Add the data to the database
  try {
    await db.collection('applications').doc(applicationId).delete();

    return res.status(200).json({ message: 'Application deleted successfully'});
  } 
  catch (error) {
    console.error('Error deleting application:', error);
    return res.status(500).json({ error: 'DATABASE_ERROR' });
  }
})

app.use(express.json());

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

