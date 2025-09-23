import express, { Request, Response } from 'express';
import * as yup from 'yup';
import { getDb } from '../config/firebase.js';
import { sendApplicationEmail, sendDeletionEmail } from '../services/emailService.js';
import { isEmailEnabled } from '../services/mail.js';

const router = express.Router();
const DB_COLLECTION = 'applications_f25';

interface ApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  year: number;
}

// POST /apply
router.post('/', async (req: Request, res: Response) => {
  const applicationSchema = yup.object().shape({
    firstName: yup.string().required(),
    lastName: yup.string().required(),
    email: yup.string().email().required(),
    year: yup.number().integer().min(2025).max(2030).required(),
  });

  try {
    const validatedData = await applicationSchema.validate(req.body, { abortEarly: false }) as ApplicationData;
    const { firstName, lastName, email, year } = validatedData;
    const createdAt = new Date().toISOString();

    const db = getDb();

    // Check if email already exists
    const existingApplications = await db.collection(DB_COLLECTION)
      .where('email', '==', email)
      .get();

    if (!existingApplications.empty) {
      return res.status(400).json({ 
        error: 'An application with this email already exists.', 
        errorType: 'EMAIL_ALREADY_EXISTS' 
      });
    }

    // Store the application
    const docRef = await db.collection(DB_COLLECTION).add({
      firstName,
      lastName,
      email,
      year,
      createdAt,
      updatedAt: createdAt,
    });

    const applicationId = `app_${docRef.id}`;

    // Send application email (non-blocking)
    sendApplicationEmail(firstName, lastName, email, applicationId)
      .then(result => {
        if (result.success) {
          console.log(`Application email sent successfully to ${email}`);
        } else {
          console.error(`Failed to send application email to ${email}:`, result.error);
        }
      })
      .catch(error => {
        console.error(`Error sending application email to ${email}:`, error);
      });

    // Respond with success
    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId,
      email_sent: isEmailEnabled() 
        ? `Confirmation email sent to ${email}` 
        : 'Email service is currently down, no confirmation email sent, please contact support and remember your application id!'
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: error.errors, 
        errorType: 'INVALID_REQUEST' 
      });
    }
    console.error('Error processing application:', error);
    res.status(500).json({ error: 'Internal server error', errorType: 'DATABASE_ERROR' });
  }
});

// DELETE /apply
router.delete('/', async (req: Request, res: Response) => {
  const applicationId = req.query.applicationId as string;
  
  if (!applicationId || !applicationId.startsWith('app_')) {
    return res.status(400).json({ 
      error: 'Invalid or missing application ID', 
      errorType: 'INVALID_APPLICATION_ID' 
    });
  }

  const docId = applicationId.replace('app_', '');
  
  try {
    const db = getDb();
    const docRef = db.collection(DB_COLLECTION).doc(docId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        error: 'Application not found', 
        errorType: 'APPLICATION_NOT_FOUND' 
      });
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
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Internal server error', errorType: 'DATABASE_ERROR' });
  }
});

export default router;