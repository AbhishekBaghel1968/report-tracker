const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Helper to calculate formatted date string
 */
function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format file size into human readable string
 */
function formatSize(bytes) {
  if (!bytes) return 'Unknown Size';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Generates the PDF document and pipes it to the output stream.
 * 
 * @param {WritableStream} outputStream - Express response or writable stream
 * @param {object} complaint - Complaint Sequelize instance with associations
 * @param {Array} timeline - Timeline entries array
 */
async function generateComplaintPDF(outputStream, complaint, timeline) {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Generate QR Code Buffer
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const verifyUrl = `${frontendUrl}/track-complaint?id=${complaint.complaintId}`;
      let qrBuffer = null;
      try {
        qrBuffer = await QRCode.toBuffer(verifyUrl, {
          width: 150,
          margin: 1,
          errorCorrectionLevel: 'H'
        });
      } catch (err) {
        console.error('Failed to generate verification QR code:', err);
      }

      // 2. Initialize PDFDocument
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 110, bottom: 50, left: 45, right: 45 },
        bufferPages: true
      });

      doc.pipe(outputStream);

      // 3. Write Main Content
      
      // SECTION 1: COMPLAINT SUMMARY
      doc.fillColor('#0b3c5d');
      doc.font('Helvetica-Bold');
      doc.fontSize(12);
      doc.text('1. Complaint Summary', 45, doc.y);
      doc.moveDown(0.4);

      // We will draw a structured key-value detail table
      const startY = doc.y;
      const colWidth = (doc.page.width - 90) / 2;
      const rightColX = 45 + colWidth;

      const metadata = [
        { label1: 'Tracking ID', val1: complaint.complaintId || 'N/A', label2: 'Case Status', val2: (complaint.status || 'N/A').replace('_', ' ') },
        { label1: 'Incident Category', val1: complaint.category || 'N/A', label2: 'Priority Level', val2: complaint.priority || 'N/A' },
        { label1: 'Incident Date', val1: formatDate(complaint.incidentDate), label2: 'Location Vector', val2: complaint.location || 'N/A' },
        { label1: 'Citizen Submitter', val1: complaint.user?.name || 'Anonymous', label2: 'Citizen Phone', val2: complaint.user?.phone || 'N/A' },
        { label1: 'Citizen Email', val1: complaint.user?.email || 'N/A', label2: 'Assigned Officer', val2: complaint.officer?.name || 'Unassigned' }
      ];

      let currentY = startY;
      metadata.forEach((row) => {
        // Draw Left Block Backgrounds
        doc.fillColor('#f1f5f9').rect(45, currentY, 110, 18).fill();
        doc.fillColor('#f8fafc').rect(155, currentY, colWidth - 110, 18).fill();
        // Draw Left Labels & Values
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8).text(row.label1, 50, currentY + 5);
        doc.fillColor('#1e293b').font('Helvetica').fontSize(8).text(row.val1, 160, currentY + 5, { width: colWidth - 118, ellipsis: true });

        // Draw Right Block Backgrounds
        doc.fillColor('#f1f5f9').rect(rightColX, currentY, 110, 18).fill();
        doc.fillColor('#f8fafc').rect(rightColX + 110, currentY, colWidth - 110, 18).fill();
        // Draw Right Labels & Values
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8).text(row.label2, rightColX + 5, currentY + 5);
        
        // Highlight Status if needed
        if (row.label2 === 'Case Status') {
          let statusColor = '#8b5cf6'; // Default submitted
          if (row.val2 === 'RESOLVED') statusColor = '#10b981';
          if (row.val2 === 'REJECTED') statusColor = '#f43f5e';
          if (row.val2 === 'INVESTIGATING') statusColor = '#00f0ff';
          if (row.val2 === 'UNDER REVIEW') statusColor = '#f59e0b';
          doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(8).text(row.val2, rightColX + 115, currentY + 5);
        } else {
          doc.fillColor('#1e293b').font('Helvetica').fontSize(8).text(row.val2, rightColX + 115, currentY + 5, { width: colWidth - 118, ellipsis: true });
        }

        currentY += 21;
      });

      doc.y = currentY + 5;

      // Complaint Statement
      doc.fillColor('#0b3c5d').font('Helvetica-Bold').fontSize(9.5).text('Citizen Incident Statement:', 45, doc.y);
      doc.moveDown(0.3);
      
      doc.save();
      doc.strokeColor('#cbd5e1');
      doc.lineWidth(1);
      
      const statementText = complaint.description || 'No statement details provided by user.';
      const statementHeight = doc.heightOfString(statementText, { width: doc.page.width - 100 }) + 14;
      
      // Draw callout box for statement
      doc.fillColor('#fafafa').rect(45, doc.y, doc.page.width - 90, statementHeight).fill();
      doc.rect(45, doc.y, doc.page.width - 90, statementHeight).stroke();
      
      doc.fillColor('#334155').font('Helvetica-Oblique').fontSize(8.5);
      doc.text(statementText, 52, doc.y + 7, { width: doc.page.width - 104, align: 'justify', lineGap: 2 });
      doc.restore();
      
      doc.y += statementHeight + 15;

      // SECTION 2: TIMELINE
      doc.fillColor('#0b3c5d').font('Helvetica-Bold').fontSize(12).text('2. Case Audit Timeline', 45, doc.y);
      doc.moveDown(0.4);

      if (!timeline || timeline.length === 0) {
        doc.fillColor('#64748b').font('Helvetica').fontSize(8.5).text('No status updates or timeline events logged.');
        doc.moveDown(1.5);
      } else {
        // Sort timeline items chronologically (oldest first)
        const sortedTimeline = [...timeline].sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt));

        sortedTimeline.forEach((evt, idx) => {
          // Check for page break
          if (doc.y > doc.page.height - 110) {
            doc.addPage();
          }

          const nodeY = doc.y;
          
          // Draw Timeline nodes
          doc.save();
          // Draw connecting line to next item if not last
          if (idx < sortedTimeline.length - 1) {
            doc.strokeColor('#cbd5e1').lineWidth(1.2).moveTo(52, nodeY + 5).lineTo(52, nodeY + 35).stroke();
          }
          // Draw node bullet
          doc.circle(52, nodeY + 5, 4.5).fillColor('#0b3c5d').fill();
          doc.restore();

          // Title
          const evtTitle = evt.title || `Status updated to ${evt.stage ? evt.stage.replace('_', ' ') : 'SUBMITTED'}`;
          doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(8.5).text(evtTitle, 66, nodeY);
          
          // Metadata (Date, Role, Operator)
          const evtMeta = `${formatDate(evt.timestamp || evt.createdAt)} | Authority: ${evt.updatedBy || evt.role || 'System'}`;
          doc.fillColor('#64748b').font('Helvetica').fontSize(7.5).text(evtMeta, 66, nodeY + 11);

          // Details text
          const evtMsg = evt.description || evt.message || '';
          doc.fillColor('#334155').font('Helvetica').fontSize(8).text(evtMsg, 66, nodeY + 20, { width: doc.page.width - 120 });
          
          doc.y = nodeY + 32; // Standard offset spacer
        });
        
        doc.moveDown(1);
      }

      // SECTION 3: EVIDENCE
      // Combine citizen uploads and officer uploads
      const citizenEvidence = complaint.evidenceFiles || [];
      const officerEvidence = complaint.evidenceUploads || [];
      const allEvidence = [
        ...citizenEvidence.map(e => ({ name: e.fileName, size: e.fileSize, hash: e.fileHash, source: 'Citizen Upload' })),
        ...officerEvidence.map(e => ({ name: e.fileName, size: e.fileSize, hash: e.fileHash, source: 'Officer Investigation' }))
      ];

      // Check page break
      if (doc.y > doc.page.height - 120) {
        doc.addPage();
      }

      doc.fillColor('#0b3c5d').font('Helvetica-Bold').fontSize(12).text('3. Attached Evidence Dossier', 45, doc.y);
      doc.moveDown(0.4);

      if (allEvidence.length === 0) {
        doc.fillColor('#64748b').font('Helvetica').fontSize(8.5).text('No digital or physical evidence logs attached to this case file.');
        doc.moveDown(1.5);
      } else {
        // Draw Table Header
        const evTableY = doc.y;
        doc.fillColor('#e2e8f0').rect(45, evTableY, doc.page.width - 90, 16).fill();
        
        doc.fillColor('#334155').font('Helvetica-Bold').fontSize(7.5);
        doc.text('File Document Name', 52, evTableY + 4);
        doc.text('Source Agent', 200, evTableY + 4);
        doc.text('Forensic SHA-256 Hash Signature', 290, evTableY + 4);
        doc.text('File Size', doc.page.width - 95, evTableY + 4, { align: 'right', width: 45 });

        let evCurrentY = evTableY + 16;
        allEvidence.forEach((item, idx) => {
          if (evCurrentY > doc.page.height - 80) {
            doc.addPage();
            // Redraw Header
            evCurrentY = doc.y;
            doc.fillColor('#e2e8f0').rect(45, evCurrentY, doc.page.width - 90, 16).fill();
            doc.fillColor('#334155').font('Helvetica-Bold').fontSize(7.5);
            doc.text('File Document Name', 52, evCurrentY + 4);
            doc.text('Source Agent', 200, evCurrentY + 4);
            doc.text('Forensic SHA-256 Hash Signature', 290, evCurrentY + 4);
            doc.text('File Size', doc.page.width - 95, evCurrentY + 4, { align: 'right', width: 45 });
            evCurrentY += 16;
          }

          // Row Background Striping
          if (idx % 2 === 1) {
            doc.fillColor('#f8fafc').rect(45, evCurrentY, doc.page.width - 90, 15).fill();
          }

          doc.fillColor('#1e293b').font('Helvetica').fontSize(7.5);
          doc.text(item.name, 52, evCurrentY + 4, { width: 140, ellipsis: true });
          doc.text(item.source, 200, evCurrentY + 4, { width: 85 });
          doc.fillColor('#475569').font('Courier').fontSize(6.5);
          doc.text(item.hash || 'Dossier forensic pending', 290, evCurrentY + 4.5, { width: 190 });
          doc.fillColor('#1e293b').font('Helvetica').fontSize(7.5);
          doc.text(formatSize(item.size), doc.page.width - 95, evCurrentY + 4, { align: 'right', width: 45 });

          evCurrentY += 15;
        });

        doc.y = evCurrentY + 15;
      }

      // SECTION 4: OFFICER INVESTIGATION NOTES
      const notes = complaint.officerNotes || [];

      // Check page break
      if (doc.y > doc.page.height - 120) {
        doc.addPage();
      }

      doc.fillColor('#0b3c5d').font('Helvetica-Bold').fontSize(12).text('4. Officer Investigation Notes', 45, doc.y);
      doc.moveDown(0.4);

      if (notes.length === 0) {
        doc.fillColor('#64748b').font('Helvetica').fontSize(8.5).text('No internal investigator notes logged on this case file.');
        doc.moveDown(1.5);
      } else {
        notes.forEach((note) => {
          const noteHeight = doc.heightOfString(note.note, { width: doc.page.width - 110 }) + 20;

          if (doc.y + noteHeight > doc.page.height - 70) {
            doc.addPage();
          }

          const currentNoteY = doc.y;

          // Box
          doc.save();
          doc.fillColor('#fafafa').rect(45, currentNoteY, doc.page.width - 90, noteHeight).fill();
          doc.strokeColor('#e2e8f0').lineWidth(0.8).rect(45, currentNoteY, doc.page.width - 90, noteHeight).stroke();
          doc.restore();

          // Heading
          doc.fillColor('#1e3a8a').font('Helvetica-Bold').fontSize(7.5).text(`LOGGED BY: ${note.officerName || 'Cyber Officer'} (ID: ${note.officerId})`, 55, currentNoteY + 6);
          doc.fillColor('#64748b').font('Helvetica').fontSize(7.5).text(formatDate(note.createdAt) + ' ' + new Date(note.createdAt).toLocaleTimeString(), doc.page.width - 190, currentNoteY + 6, { align: 'right', width: 135 });

          // Divider inside note box
          doc.strokeColor('#f1f5f9').lineWidth(0.5).moveTo(55, currentNoteY + 16).lineTo(doc.page.width - 55, currentNoteY + 16).stroke();

          // Body
          doc.fillColor('#334155').font('Helvetica').fontSize(8).text(note.note, 55, currentNoteY + 22, { width: doc.page.width - 110, lineGap: 1.5 });

          doc.y = currentNoteY + noteHeight + 10;
        });
        
        doc.moveDown(1);
      }

      // SECTION 5: FINAL RESOLUTION & REMARKS
      if (doc.y > doc.page.height - 180) {
        doc.addPage();
      }

      doc.fillColor('#0b3c5d').font('Helvetica-Bold').fontSize(12).text('5. Final Resolution & Remarks', 45, doc.y);
      doc.moveDown(0.4);

      const isResolved = complaint.status === 'RESOLVED';
      const remarkText = isResolved 
        ? 'Resolution Statement:\nThis cyber incident has been fully audited, resolved, and verified by the case officer in charge. Remedial security actions have been executed and the file is permanently closed.' 
        : 'Status Remarks:\nThis cyber complaint is currently undergoing active technical investigation, security log scanning, and forensic data gathering. Updates are recorded dynamically in the system telemetry logs.';

      doc.save();
      doc.fillColor(isResolved ? '#f0fdf4' : '#fffbeb').rect(45, doc.y, doc.page.width - 90, 42).fill();
      doc.strokeColor(isResolved ? '#bbf7d0' : '#fef3c7').lineWidth(1).rect(45, doc.y, doc.page.width - 90, 42).stroke();
      doc.fillColor(isResolved ? '#166534' : '#92400e').font('Helvetica-Bold').fontSize(8);
      doc.text(remarkText, 52, doc.y + 6, { width: doc.page.width - 104, lineGap: 3 });
      doc.restore();

      doc.y += 50;

      // DIGITAL SIGNATURE CARD SECTION
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
      }

      const sigCardY = doc.y + 10;
      doc.save();
      // Draw signature block card
      doc.fillColor('#fafafa').rect(45, sigCardY, doc.page.width - 90, 75).fill();
      doc.strokeColor('#cbd5e1').lineWidth(1).rect(45, sigCardY, doc.page.width - 90, 75).stroke();

      // Heading inside card
      doc.fillColor('#0b3c5d').font('Helvetica-Bold').fontSize(8).text('DIGITAL SIGNATURE & VERIFICATION TELEMETRY', 55, sigCardY + 8);
      
      // Verification Hash
      const trackingHashStr = complaint.aiIocs || 'SentinelSecureHashAlgorithmSHA256ChecksumVerification';
      const hashDigest = require('crypto').createHash('sha256').update(complaint.complaintId + trackingHashStr).digest('hex').toUpperCase();

      doc.fillColor('#64748b').font('Helvetica').fontSize(7.5).text('Verification Checksum:', 55, sigCardY + 22);
      doc.fillColor('#1e293b').font('Courier-Bold').fontSize(7).text(hashDigest, 55, sigCardY + 31, { width: doc.page.width - 200 });

      doc.fillColor('#64748b').font('Helvetica').fontSize(7.5).text('Authority Signatory:', 55, sigCardY + 43);
      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(7.5).text('Cyber Cell Authority Administrator', 55, sigCardY + 52);
      doc.font('Helvetica').fontSize(7).text(`Date: ${new Date().toLocaleDateString()} | Time: ${new Date().toLocaleTimeString()}`, 55, sigCardY + 61);

      // Signature Placeholder
      doc.strokeColor('#94a3b8').lineWidth(0.8).dash(3, { space: 2 }).moveTo(doc.page.width - 190, sigCardY + 50).lineTo(doc.page.width - 60, sigCardY + 50).stroke();
      doc.fillColor('#64748b').font('Helvetica').fontSize(7).text('Sentinel Signature seal', doc.page.width - 190, sigCardY + 54, { width: 130, align: 'center' });

      doc.restore();

      // 4. Finalize Page Styling (Post-process headers, footers, watermarks, borders)
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);

        // A. Double border
        doc.save();
        doc.strokeColor('#0b3c5d'); // Primary Navy Blue
        doc.lineWidth(1.25);
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

        doc.strokeColor('#d97706'); // Gold border
        doc.lineWidth(0.5);
        doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48).stroke();
        doc.restore();

        // B. Watermark
        doc.save();
        doc.fontSize(40);
        doc.fillColor('#cbd5e1');
        doc.opacity(0.12);
        doc.font('Helvetica-Bold');
        doc.translate(doc.page.width / 2, doc.page.height / 2);
        doc.rotate(-45);
        doc.text('GOVERNMENT CONFIDENTIAL', -250, -15, {
          width: 500,
          align: 'center'
        });
        doc.restore();

        // C. Headers
        if (i === 0) {
          // Draw Shield vector logo
          doc.save();
          doc.translate(45, 34);
          doc.scale(0.5);
          doc.fillColor('#0b3c5d');
          doc.moveTo(30, 0)
             .lineTo(60, 10)
             .lineTo(60, 40)
             .quadraticCurveTo(60, 65, 30, 80)
             .quadraticCurveTo(0, 65, 0, 40)
             .lineTo(0, 10)
             .closePath()
             .fill();
          doc.fillColor('#d97706');
          doc.moveTo(30, 15)
             .lineTo(37, 20)
             .lineTo(40, 30)
             .lineTo(33, 33)
             .lineTo(30, 42)
             .lineTo(27, 33)
             .lineTo(20, 30)
             .lineTo(23, 20)
             .closePath()
             .fill();
          doc.restore();

          // Title texts
          doc.save();
          doc.fillColor('#0b3c5d');
          doc.font('Helvetica-Bold');
          doc.fontSize(14);
          doc.text('SENTINEL CYBER SECURITY PORTAL', 85, 36);
          doc.fontSize(9.5);
          doc.fillColor('#b45309');
          doc.text('CYBER CRIME COMPLAINT AUDIT REPORT', 85, 52);
          doc.fontSize(8);
          doc.fillColor('#475569');
          doc.font('Helvetica');
          doc.text(`TRACKING ID: ${complaint.complaintId || 'N/A'}`, 85, 65);
          doc.text(`Incident Category: ${complaint.category || 'N/A'}`, 85, 75);
          doc.restore();

          // QR Code verification placement
          if (qrBuffer) {
            doc.image(qrBuffer, doc.page.width - 95, 32, { width: 50 });
            doc.fontSize(6);
            doc.fillColor('#64748b');
            doc.text('Verify authenticity', doc.page.width - 95, 84, { width: 50, align: 'center' });
          }

          // Top Header Divider Line
          doc.save();
          doc.strokeColor('#0b3c5d');
          doc.lineWidth(1.2);
          doc.moveTo(40, 94).lineTo(doc.page.width - 40, 94).stroke();
          doc.restore();
        } else {
          // Compact header on subsequent pages
          doc.save();
          doc.translate(45, 26);
          doc.scale(0.25);
          doc.fillColor('#0b3c5d');
          doc.moveTo(30, 0)
             .lineTo(60, 10)
             .lineTo(60, 40)
             .quadraticCurveTo(60, 65, 30, 80)
             .quadraticCurveTo(0, 65, 0, 40)
             .lineTo(0, 10)
             .closePath()
             .fill();
          doc.fillColor('#d97706');
          doc.moveTo(30, 15)
             .lineTo(37, 20)
             .lineTo(40, 30)
             .lineTo(33, 33)
             .lineTo(30, 42)
             .lineTo(27, 33)
             .lineTo(20, 30)
             .lineTo(23, 20)
             .closePath()
             .fill();
          doc.restore();

          doc.save();
          doc.fillColor('#0b3c5d');
          doc.font('Helvetica-Bold');
          doc.fontSize(9);
          doc.text('SENTINEL SECURE COMPLAINT PORTAL', 68, 28);
          doc.font('Helvetica');
          doc.fontSize(8);
          doc.fillColor('#475569');
          doc.text(`TRACKING ID: ${complaint.complaintId}`, doc.page.width - 180, 29, { width: 140, align: 'right' });

          doc.strokeColor('#e2e8f0');
          doc.lineWidth(0.8);
          doc.moveTo(40, 46).lineTo(doc.page.width - 40, 46).stroke();
          doc.restore();
        }

        // D. Footer
        doc.save();
        doc.fontSize(7);
        doc.fillColor('#64748b');
        doc.font('Helvetica');
        const fY = doc.page.height - 35;
        
        doc.text('Generated by Sentinel Portal System', 45, fY);
        
        const timestampStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) + ' (IST)';
        doc.text(`Exported: ${timestampStr}`, doc.page.width / 2 - 120, fY, { width: 240, align: 'center' });
        
        doc.text(`Page ${i + 1} of ${range.count}`, doc.page.width - 125, fY, { width: 80, align: 'right' });
        doc.restore();
      }

      doc.end();
      resolve();
    } catch (err) {
      console.error('Error during pdf generation:', err);
      reject(err);
    }
  });
}

module.exports = {
  generateComplaintPDF
};
