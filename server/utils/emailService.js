const nodemailer = require('nodemailer');

// Create a transporter using environment variables
const createTransporter = () => {
  // For development/testing: use Gmail or a custom SMTP server
  if (process.env.SMTP_HOST) {
    // Custom SMTP (e.g., Mailtrap for dev, SendGrid for prod)
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: Gmail (requires App Password in Google Account)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App Password (not regular password)
    },
  });
};

/**
 * Send a generic email
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"JobWave Portal" <${process.env.EMAIL_USER || 'noreply@jobwave.com'}>`,
      to,
      subject,
      text: text || subject,
      html,
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Welcome email after registration
 */
const sendWelcomeEmail = async ({ to, firstName, role }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7ff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(99,102,241,0.12); }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 16px; }
        .body { padding: 40px 32px; }
        .body h2 { color: #1e1b4b; font-size: 22px; margin-top: 0; }
        .body p { color: #4b5563; line-height: 1.7; font-size: 15px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; font-size: 15px; }
        .footer { background: #f9fafb; padding: 24px 32px; text-align: center; color: #9ca3af; font-size: 13px; border-top: 1px solid #f3f4f6; }
        .chip { display: inline-block; background: #ede9fe; color: #7c3aed; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌊 Welcome to JobWave!</h1>
          <p>Your accessibility-first career platform</p>
        </div>
        <div class="body">
          <span class="chip">${role === 'employer' ? '🏢 Employer Account' : '👤 Candidate Account'}</span>
          <h2>Hi ${firstName || 'there'}, you're all set! 🎉</h2>
          <p>
            ${role === 'employer'
              ? 'You can now post job listings, review applications, and connect with talented candidates who align with your company\'s values and needs.'
              : 'You can now search and apply for jobs, upload your resume for ATS analysis, and track all your applications in one place.'
            }
          </p>
          <p>Here\'s what you can do right now:</p>
          <ul style="color: #4b5563; line-height: 2; font-size: 15px;">
            ${role === 'employer'
              ? '<li>📝 Post your first job listing</li><li>🔍 Browse candidate profiles</li><li>📊 Manage applications from your dashboard</li>'
              : '<li>🔍 Browse available job listings</li><li>📄 Upload and analyze your resume with our ATS tool</li><li>📊 Track your application statuses from your dashboard</li>'
            }
          </ul>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn">Go to Your Dashboard →</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} JobWave Portal. All rights reserved.</p>
          <p>You received this email because you signed up at JobWave.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Welcome to JobWave, ${firstName || 'there'}! 🎉`,
    html,
  });
};

/**
 * Job application confirmation to candidate
 */
const sendApplicationConfirmation = async ({ to, candidateName, jobTitle, companyName }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7ff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(99,102,241,0.12); }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 26px; }
        .body { padding: 40px 32px; }
        .body h2 { color: #1e1b4b; margin-top: 0; }
        .card { background: #f5f3ff; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border-left: 4px solid #6366f1; }
        .card p { margin: 6px 0; color: #4b5563; font-size: 14px; }
        .card strong { color: #1e1b4b; }
        .body p { color: #4b5563; line-height: 1.7; font-size: 15px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; font-size: 15px; }
        .footer { background: #f9fafb; padding: 24px 32px; text-align: center; color: #9ca3af; font-size: 13px; border-top: 1px solid #f3f4f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Application Submitted!</h1>
        </div>
        <div class="body">
          <h2>Hi ${candidateName},</h2>
          <p>Your application has been successfully submitted. Here's a summary:</p>
          <div class="card">
            <p><strong>Position:</strong> ${jobTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Status:</strong> Applied</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <p>You can track the progress of your application from your personal dashboard. You'll be notified when the employer reviews your application.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn">Track Application →</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} JobWave Portal. Good luck! 🍀</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Application Confirmed: ${jobTitle} at ${companyName}`,
    html,
  });
};

/**
 * New applicant notification to employer
 */
const sendNewApplicantAlert = async ({ to, employerName, jobTitle, candidateName, applicationId }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7ff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(99,102,241,0.12); }
        .header { background: linear-gradient(135deg, #059669, #10b981); padding: 40px 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 26px; }
        .body { padding: 40px 32px; }
        .body h2 { color: #1e1b4b; margin-top: 0; }
        .card { background: #ecfdf5; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border-left: 4px solid #10b981; }
        .card p { margin: 6px 0; color: #374151; font-size: 14px; }
        .card strong { color: #1e1b4b; }
        .body p { color: #4b5563; line-height: 1.7; font-size: 15px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; font-size: 15px; }
        .footer { background: #f9fafb; padding: 24px 32px; text-align: center; color: #9ca3af; font-size: 13px; border-top: 1px solid #f3f4f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 New Applicant!</h1>
        </div>
        <div class="body">
          <h2>Hi ${employerName},</h2>
          <p>You have a new applicant for one of your job listings:</p>
          <div class="card">
            <p><strong>Candidate:</strong> ${candidateName}</p>
            <p><strong>Applied For:</strong> ${jobTitle}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <p>Review the candidate's profile and resume from your employer dashboard.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn">Review Application →</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} JobWave Portal.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `New Applicant: ${candidateName} applied for ${jobTitle}`,
    html,
  });
};

/**
 * Application status update to candidate
 */
const sendStatusUpdateEmail = async ({ to, candidateName, jobTitle, companyName, newStatus }) => {
  const statusConfig = {
    'In Review': { emoji: '🔍', color: '#f59e0b', bg: '#fffbeb', label: 'Your application is being reviewed' },
    'Interview': { emoji: '🗣️', color: '#7c3aed', bg: '#f5f3ff', label: 'You\'ve been selected for an interview!' },
    'Offered': { emoji: '🎉', color: '#059669', bg: '#ecfdf5', label: 'Congratulations! You received an offer!' },
    'Rejected': { emoji: '💌', color: '#dc2626', bg: '#fef2f2', label: 'Thank you for your interest' },
  };

  const cfg = statusConfig[newStatus] || { emoji: '📋', color: '#6366f1', bg: '#f5f3ff', label: 'Status updated' };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7ff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(99,102,241,0.12); }
        .header { background: ${cfg.color}; padding: 40px 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 26px; }
        .body { padding: 40px 32px; }
        .body h2 { color: #1e1b4b; margin-top: 0; }
        .status-badge { display: inline-block; background: ${cfg.bg}; color: ${cfg.color}; padding: 8px 18px; border-radius: 20px; font-weight: 700; font-size: 15px; border: 2px solid ${cfg.color}; margin: 12px 0; }
        .card { background: ${cfg.bg}; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border-left: 4px solid ${cfg.color}; }
        .card p { margin: 6px 0; color: #374151; font-size: 14px; }
        .card strong { color: #1e1b4b; }
        .body p { color: #4b5563; line-height: 1.7; font-size: 15px; }
        .btn { display: inline-block; background: ${cfg.color}; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; font-size: 15px; }
        .footer { background: #f9fafb; padding: 24px 32px; text-align: center; color: #9ca3af; font-size: 13px; border-top: 1px solid #f3f4f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${cfg.emoji} Application Update</h1>
        </div>
        <div class="body">
          <h2>Hi ${candidateName},</h2>
          <p>${cfg.label}</p>
          <span class="status-badge">${newStatus}</span>
          <div class="card">
            <p><strong>Position:</strong> ${jobTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>New Status:</strong> ${newStatus}</p>
          </div>
          ${newStatus === 'Interview' ? '<p><strong>Next Steps:</strong> The employer will reach out soon to schedule your interview. Make sure your contact details in your profile are up to date.</p>' : ''}
          ${newStatus === 'Offered' ? '<p><strong>Next Steps:</strong> Please log in to your dashboard to review the offer details and respond to the employer.</p>' : ''}
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn">View in Dashboard →</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} JobWave Portal.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Application Update: ${jobTitle} at ${companyName} — ${newStatus}`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendApplicationConfirmation,
  sendNewApplicantAlert,
  sendStatusUpdateEmail,
};
