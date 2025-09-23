export const createApplicationEmailHTML = (
  firstName: string, 
  lastName: string, 
  applicationId: string
): string => {
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

export const createDeletionEmailHTML = (
  firstName: string, 
  lastName: string, 
  applicationId: string
): string => {
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