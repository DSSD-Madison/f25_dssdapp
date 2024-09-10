// Import required modules
import express from 'express';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import * as yup from 'yup';

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
  message: { error: 'Too many requests, please try again later.', errorType: 'RATE_LIMIT_EXCEEDED' }
});

// Apply rate limiter to the API endpoint
app.use('/apply', limiter);

// Routes
app.get('/', (req: express.Request, res: express.Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Validation schemas
const applicationSchema = yup.object().shape({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  phone_number: yup.string().matches(/^[0-9]{10}$/, 'Phone number must be 10 digits').required('Phone number is required'),
  year: yup.number().positive('Year must be a positive number').integer('Year must be an integer').required('Year is required'),
  why_do_you_want_to_join: yup.string().required('Reason for joining is required'),
  urls: yup.array().of(yup.string().url('Invalid URL format')).required('At least one URL is required')
});

const updateSchema = yup.object().shape({
  applicationId: yup.string().required('Application ID is required'),
  applicationData: applicationSchema
});

interface ApplicationData extends yup.InferType<typeof applicationSchema> {}
interface UpdateData extends yup.InferType<typeof updateSchema> {}

// API endpoint for handling POST requests
app.post('/apply', async (req: express.Request, res: express.Response) => {
  try {
    const applicationData: ApplicationData = await applicationSchema.validate(req.body, { abortEarly: false });
    
    const docRef = await db.collection('applications').add({
      ...applicationData,
      timestamp: new Date()
    });
    
    return res.status(200).json({ message: 'Application submitted successfully. Make sure to write down your application id!', applicationId: docRef.id });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const validationErrors = error.inner.map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ error: 'Validation failed', errorType: 'INVALID_REQUEST', details: validationErrors });
    }
    
    console.error('Error submitting application:', error);
    return res.status(500).json({ error: 'An unexpected error occurred', errorType: 'DATABASE_ERROR' });
  }
});

app.patch('/apply', async (req: express.Request, res: express.Response) => {
  try {
    const { applicationId, applicationData }: UpdateData = await updateSchema.validate(req.body, { abortEarly: false });

    await db.collection('applications').doc(applicationId).set({
      ...applicationData,
      timestamp: new Date()
    }, { merge: true });

    return res.status(200).json({ message: 'Application updated successfully. Make sure to write down your application id!', applicationId: applicationId });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const validationErrors = error.inner.map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ error: 'Validation failed', errorType: 'INVALID_REQUEST', details: validationErrors });
    }
    
    console.error('Error updating application:', error);
    return res.status(500).json({ error: 'An unexpected error occurred', errorType: 'DATABASE_ERROR' });
  }
});

app.delete('/apply', async (req: express.Request, res: express.Response) => {
  try {
    const { applicationId } = await yup.object({
      applicationId: yup.string().required('Application ID is required')
    }).validate(req.body, { abortEarly: false });

    await db.collection('applications').doc(applicationId).delete();

    return res.status(200).json({ message: 'Application deleted successfully' });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const validationErrors = error.inner.map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ error: 'Validation failed', errorType: 'INVALID_REQUEST', details: validationErrors });
    }
    
    console.error('Error deleting application:', error);
    return res.status(500).json({ error: 'An unexpected error occurred', errorType: 'DATABASE_ERROR' });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});