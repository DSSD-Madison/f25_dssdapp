import sgMail from '@sendgrid/mail';

let isInitialized = false;

export const initializeSendGrid = () => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY environment variable not found');
      return false;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    isInitialized = true;
    console.log('SendGrid initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing SendGrid:', error);
    return false;
  }
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isInitialized) {
    console.warn('SendGrid not available, skipping email send');
    return { success: false, error: 'SendGrid service not configured' };
  }

  try {
    const msg = {
      to,
      from: 'dssdmadisonapplications@gmail.com',
      subject,
      html,
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('SendGrid error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const isEmailEnabled = () => isInitialized;