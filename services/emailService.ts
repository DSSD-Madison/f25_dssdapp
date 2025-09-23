import { sendEmail } from './mail.js';
import { createApplicationEmailHTML, createDeletionEmailHTML } from '../templates/emailTemplates.js';

export const sendApplicationEmail = async (
  firstName: string, 
  lastName: string, 
  email: string, 
  applicationId: string
) => {
  const html = createApplicationEmailHTML(firstName, lastName, applicationId);
  
  return sendEmail(
    email,
    '🎉 Thank you for applying to DSSD - Application Received!',
    html
  );
};

export const sendDeletionEmail = async (
  firstName: string, 
  lastName: string, 
  email: string, 
  applicationId: string
) => {
  const html = createDeletionEmailHTML(firstName, lastName, applicationId);
  
  return sendEmail(
    email,
    'DSSD Application Withdrawn',
    html
  );
};