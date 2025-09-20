// Import required modules
import express from 'express';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import * as yup from 'yup';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

// Environment configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const PORT = process.env.PORT || 8080;

console.log(`Starting API in ${isDevelopment ? 'development' : 'production'} mode`);

// Initialize Firebase Admin SDK
let firebaseApp;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully');
  } else {
    console.error('FIREBASE_SERVICE_ACCOUNT environment variable not found');
    process.exit(1);
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

// Initialize Firestore
const db = getFirestore(firebaseApp);

// Initialize Email Transporter
let transporter: nodemailer.Transporter | null = null;
try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
  
  // Verify email configuration on startup
  transporter.verify((error, success) => {
    if (error) {
      console.error('Email configuration error:', error);
      console.warn('Email sending will be disabled');
      transporter = null;
    } else {
      console.log('Email configuration verified successfully');
    }
  });
} catch (error) {
  console.error('Failed to initialize email transporter:', error);
  console.warn('Email sending will be disabled');
}

const app = express();

app.use(express.json());

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: 'Too many requests, please try again later (like in a min).', errorType: 'RATE_LIMIT_EXCEEDED' }
});

// Apply rate limiter to the API endpoint
app.use('/apply', limiter);

// Email template functions
const createWelcomeEmailHTML = (firstName: string, lastName: string, applicationId: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #c5050c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Thank you for applying to DSSD!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${firstName}!</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Thank you for applying to the Data Science for Sustainable Development program at UW Madison. 
          We've successfully received your application!
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #c5050c; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Your Application Details</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p style="margin: 5px 0;"><strong>Application ID:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${applicationId}</code></p>
          <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="color: #0366d6; margin-top: 0;">📋 Next Steps</h4>
          <ol style="color: #666; padding-left: 20px;">
            <li>Our team will review your application</li>
            <li>You'll hear back from us within the next week</li>
            <li>Keep an eye on your email for updates</li>
          </ol>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="color: #856404; margin-top: 0;">⚠️ Important</h4>
          <p style="color: #856404; margin: 0;">
            Save your Application ID: <strong>${applicationId}</strong><br>
            You'll need it to submit your google form and for any future correspondence.
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Questions? Visit our <a href="https://madison.dssdglobal.org/" style="color: #c5050c;">website</a> 
          or check out our <a href="https://docs.google.com/document/d/1PlrcmK62e-TASXnHERqlugYdU4CzLLkxe3itrBO6AZ4/" style="color: #c5050c;">recruitment FAQ</a>.
        </p>
      </div>
    </div>
  `;
};

const createDeletionEmailHTML = (firstName: string, lastName: string, applicationId: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Application Withdrawn</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #333; margin-top: 0;">Hi ${firstName},</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Your application to the Data Science for Sustainable Development program has been successfully withdrawn.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #dc3545; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Withdrawal Details</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p style="margin: 5px 0;"><strong>Application ID:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${applicationId}</code></p>
          <p style="margin: 5px 0;"><strong>Withdrawn:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Thanks for your interest in DSSD. We hope to hear from you again soon!
        </p>
      </div>
    </div>
  `;
};

// Email utility functions
const sendEmail = async (to: string, subject: string, html: string, text?: string): Promise<{ success: boolean; error?: string }> => {
  if (!transporter) {
    console.warn('Email transporter not available, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    console.log(`Sending email to: ${to}`);
    
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
      text
    });

    console.log(`Email sent successfully to ${to}, ID: ${info.messageId}`);
    return { success: true };
    
  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

const sendWelcomeEmail = async (firstName: string, lastName: string, email: string, applicationId: string) => {
  const html = createWelcomeEmailHTML(firstName, lastName, applicationId);
  const text = `Hi ${firstName}! Your DSSD application has been received. Application ID: ${applicationId}`;
  
  return sendEmail(
    email,
    '🎉 Welcome to DSSD - Application Received!',
    html,
    text
  );
};

const sendDeletionEmail = async (firstName: string, lastName: string, email: string, applicationId: string) => {
  const html = createDeletionEmailHTML(firstName, lastName, applicationId);
  const text = `Hi ${firstName}, your DSSD application (${applicationId}) has been withdrawn successfully.`;
  
  return sendEmail(
    email,
    'DSSD Application Withdrawn',
    html,
    text
  );
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: isDevelopment ? 'development' : 'production',
    emailEnabled: transporter !== null
  });
});

// get root to give out index.html inside public
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/apply', async (req, res) => {
  // Define the schema for validation
  const applicationSchema = yup.object().shape({
    firstName: yup.string().required(),
    lastName: yup.string().required(),
    email: yup.string().email().required(),
    year: yup.number().integer().min(2025).max(2030).required(),
  });

  try {
    // Validate the request body
    const validatedData = await applicationSchema.validate(req.body, { abortEarly: false });
    const { firstName, lastName, email, year } = validatedData;
    const createdAt = new Date().toISOString();

    // First check if email already exists in firestore
    const existingApplications = await db.collection('applications_f2025')
      .where('email', '==', email)
      .get();

    if (!existingApplications.empty) {
      return res.status(400).json({ error: 'An application with this email already exists.', errorType: 'EMAIL_ALREADY_EXISTS' });
    }

    // Store the application in Firestore
    const docRef = await db.collection('applications_f2025').add({
      firstName,
      lastName,
      email,
      year,
      createdAt,
      updatedAt: createdAt,
    });

    const applicationId = `app_${docRef.id}`;

    // Send welcome email (non-blocking)
    sendWelcomeEmail(firstName, lastName, email, applicationId)
      .then(result => {
        if (result.success) {
          console.log(`Welcome email sent successfully to ${email}`);
        } else {
          console.error(`Failed to send welcome email to ${email}:`, result.error);
        }
      })
      .catch(error => {
        console.error(`Error sending welcome email to ${email}:`, error);
      });

    // Respond with success and the application ID
    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId,
      email_sent: `Confirmation email sent to ${email}`,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      // Handle validation errors
      return res.status(400).json({ error: 'Invalid request data', details: error.errors, errorType: 'INVALID_REQUEST' });
    }
    console.error('Error processing application:', error);
    res.status(500).json({ error: 'Internal server error', errorType: 'DATABASE_ERROR' });
  }
});

app.delete('/apply?', async (req, res) => {
  const applicationId = req.query.applicationId as string;
  if (!applicationId || !applicationId.startsWith('app_')) {
    return res.status(400).json({ error: 'Invalid or missing application ID', errorType: 'INVALID_APPLICATION_ID' });
  }
  const docId = applicationId.replace('app_', '');
  
  try {
    const docRef = db.collection('applications_f2025').doc(docId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Application not found', errorType: 'APPLICATION_NOT_FOUND' });
    }

    const userData = doc.data();
    await docRef.delete();

    // Send deletion email (non-blocking)
    if (userData) {
      sendDeletionEmail(userData.firstName, userData.lastName, userData.email, applicationId)
        .then(result => {
          if (result.success) {
            console.log(`Deletion email sent successfully to ${userData.email}`);
          } else {
            console.error(`Failed to send deletion email to ${userData.email}:`, result.error);
          }
        })
        .catch(error => {
          console.error(`Error sending deletion email to ${userData.email}:`, error);
        });
    }

    res.status(200).json({ 
      message: 'Application deleted successfully', 
      applicationId, 
      email_sent: `Confirmation email sent to ${userData?.email}` 
    });
  } 
  catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Internal server error', errorType: 'DATABASE_ERROR' });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${isDevelopment ? 'development' : 'production'}`);
  if (transporter) {
    console.log('Email service: Enabled');
  } else {
    console.log('Email service: Disabled (check email configuration)');
  }
});