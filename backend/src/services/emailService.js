const nodemailer = require('nodemailer');

// Load environment variables
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'sentinel-alerts@cyberportal.gov';

let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT == 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  console.log('Nodemailer SMTP Transporter initialized successfully.');
} else {
  console.log('SMTP settings missing in .env. Email alerts will run in Console/Simulation Mode.');
}

/**
 * Send an email alert safely.
 */
async function sendMail({ to, subject, html, text }) {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject,
        text,
        html,
      });
      console.log(`[Email Alert] Successfully sent mail to ${to}: "${subject}"`);
    } catch (error) {
      console.error(`[Email Alert] Failed to send email via SMTP to ${to}:`, error.message);
    }
  } else {
    console.log(`
=========================================
📧 EMAIL ALERTS LOG (CONSOLE MODE)
=========================================
TO:      ${to}
SUBJECT: ${subject}
TEXT:    ${text}
=========================================
`);
  }
}

/**
 * Alert Admin of a new complaint submission.
 */
async function sendNewComplaintAlert(admins, complaint) {
  const subject = `🛡️ [Sentinel Alert] New Complaint Filed: ${complaint.complaintId}`;
  const text = `A new cyber crime incident has been logged.
Tracking ID: ${complaint.complaintId}
Category: ${complaint.category}
Priority: ${complaint.priority}
Title: ${complaint.title}

Please log in to the Sentinel SOC Terminal to audit evidence and assign an investigator.`;

  const html = `
    <div style="font-family: Arial, sans-serif; background: #07070d; color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px;">
      <h2 style="color: #00f0ff; border-bottom: 2px solid #00f0ff; padding-bottom: 10px;">🛡️ Sentinel SOC Notification</h2>
      <p>A new cyber crime complaint has been officially registered in the portal.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; color: #e2e8f0;">
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #1e1e2f;">Tracking ID:</td><td style="padding: 8px; color: #00f0ff; border-bottom: 1px solid #1e1e2f;">${complaint.complaintId}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #1e1e2f;">Title:</td><td style="padding: 8px; border-bottom: 1px solid #1e1e2f;">${complaint.title}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #1e1e2f;">Category:</td><td style="padding: 8px; border-bottom: 1px solid #1e1e2f;">${complaint.category}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #1e1e2f;">Priority:</td><td style="padding: 8px; color: #ff0055; border-bottom: 1px solid #1e1e2f;">${complaint.priority}</td></tr>
      </table>
      <p>Verify incident logs, review forensics, and assign a cyber defense investigator.</p>
      <a href="http://localhost:5173/admin-dashboard" style="display: inline-block; background: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 15px;">Open SOC Terminal</a>
    </div>
  `;

  for (const admin of admins) {
    await sendMail({ to: admin.email, subject, text, html });
  }
}

/**
 * Alert Officer of case assignment.
 */
async function sendCaseAssignmentAlert(officer, complaint) {
  const subject = `📂 [Sentinel Assignment] New Case Assigned: ${complaint.complaintId}`;
  const text = `Investigator ${officer.name},
A new security incident has been assigned to your badge:
Tracking ID: ${complaint.complaintId}
Category: ${complaint.category}
Priority: ${complaint.priority}
Title: ${complaint.title}

Please check your Case file directory for investigation updates.`;

  const html = `
    <div style="font-family: Arial, sans-serif; background: #07070d; color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px;">
      <h2 style="color: #8b5cf6; border-bottom: 2px solid #8b5cf6; padding-bottom: 10px;">📂 Case Assignment Notification</h2>
      <p>Investigator <strong>${officer.name}</strong>, a new cyber crime case file has been assigned to your badge.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; color: #e2e8f0;">
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #1e1e2f;">Case ID:</td><td style="padding: 8px; color: #8b5cf6; border-bottom: 1px solid #1e1e2f;">${complaint.complaintId}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #1e1e2f;">Title:</td><td style="padding: 8px; border-bottom: 1px solid #1e1e2f;">${complaint.title}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #1e1e2f;">Priority:</td><td style="padding: 8px; color: #ff0055; border-bottom: 1px solid #1e1e2f;">${complaint.priority}</td></tr>
      </table>
      <p>Please initiate incident review and evidence metadata audits immediately.</p>
      <a href="http://localhost:5173/officer/cases" style="display: inline-block; background: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 15px;">Open Case Folder</a>
    </div>
  `;

  await sendMail({ to: officer.email, subject, text, html });
}

/**
 * Alert Citizen of status updates.
 */
async function sendCaseStatusAlert(citizen, complaint) {
  const statusFormatted = complaint.status.replace('_', ' ');
  const subject = `🔔 [Sentinel Update] Case Status Updated: ${complaint.complaintId}`;
  const text = `Dear ${citizen.name},
Your cyber crime complaint ${complaint.complaintId} status has been updated.
Current Status: ${statusFormatted}

You can track real-time investigation steps on the Portal using your tracking ID.`;

  const html = `
    <div style="font-family: Arial, sans-serif; background: #07070d; color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px;">
      <h2 style="color: #00ff66; border-bottom: 2px solid #00ff66; padding-bottom: 10px;">🔔 Investigation Update</h2>
      <p>Dear <strong>${citizen.name}</strong>,</p>
      <p>The status of your cyber complaint has been officially updated by the investigating agency.</p>
      <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-left: 4px solid #00ff66; margin: 20px 0; border-radius: 4px;">
        <strong>Complaint ID:</strong> ${complaint.complaintId}<br>
        <strong>Current Status:</strong> <span style="color: #00ff66; font-weight: bold;">${statusFormatted}</span>
      </div>
      <p>Track real-time timeline telemetry and upload further evidence if requested.</p>
      <a href="http://localhost:5173/track-complaint?id=${complaint.complaintId}" style="display: inline-block; background: #00f0ff; color: #07070d; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 15px;">Track Complaint Status</a>
    </div>
  `;

  await sendMail({ to: citizen.email, subject, text, html });
}

module.exports = {
  sendNewComplaintAlert,
  sendCaseAssignmentAlert,
  sendCaseStatusAlert,
};
