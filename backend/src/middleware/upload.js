const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('Sharp dependency could not be loaded. EXIF stripping is disabled.', e.message);
}
require('dotenv').config();

const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

const memoryStorage = multer.memoryStorage();

const rawMulter = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

function verifyFileSignature(buffer, originalname) {
  const ext = path.extname(originalname).toLowerCase();
  
  if (['.jpg', '.jpeg'].includes(ext)) {
    if (buffer.length < 3) return false;
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }
  
  if (ext === '.png') {
    if (buffer.length < 8) return false;
    const pngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    return pngHeader.every((val, i) => buffer[i] === val);
  }
  
  if (ext === '.pdf') {
    if (buffer.length < 4) return false;
    const pdfHeader = [0x25, 0x50, 0x44, 0x46];
    return pdfHeader.every((val, i) => buffer[i] === val);
  }
  
  return false;
}

// Custom wrapper middleware to handle validation and EXIF stripping
function makeUploadMiddleware(fieldName) {
  const multerMiddleware = rawMulter.single(fieldName);
  
  return (req, res, next) => {
    multerMiddleware(req, res, async (err) => {
      if (err) {
        return next(err);
      }
      
      if (!req.file) {
        return next();
      }
      
      const file = req.file;
      const ext = path.extname(file.originalname).toLowerCase();
      
      // 1. Basic extension check
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return res.status(400).json({ error: 'File type not supported. Only JPG, PNG, and PDF files are allowed.' });
      }
      
      // 2. Magic number verification
      if (!verifyFileSignature(file.buffer, file.originalname)) {
        return res.status(400).json({ error: 'File integrity check failed. The file contents do not match the declared file extension.' });
      }
      
      // 3. EXIF metadata stripping for images
      let processedBuffer = file.buffer;
      if (['.jpg', '.jpeg', '.png'].includes(ext) && sharp) {
        try {
          processedBuffer = await sharp(file.buffer).toBuffer();
          console.log(`EXIF Stripping: Stripped metadata from ${file.originalname}. Size: ${file.buffer.length} -> ${processedBuffer.length}`);
        } catch (sharpErr) {
          console.warn(`EXIF Stripping failed for ${file.originalname}:`, sharpErr.message);
        }
      }
      
      // 4. Save to disk with unique sanitized name
      const baseName = path.basename(file.originalname, ext);
      const sanitizedBase = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${crypto.randomUUID()}_${sanitizedBase}${ext}`;
      const destPath = path.join(uploadDir, uniqueFileName);
      
      try {
        fs.writeFileSync(destPath, processedBuffer);
        
        // 5. Update req.file details to mimic diskStorage structure
        req.file.filename = uniqueFileName;
        req.file.path = destPath;
        req.file.size = processedBuffer.length;
        
        next();
      } catch (writeErr) {
        console.error('Failed to write uploaded file to disk:', writeErr);
        return res.status(500).json({ error: 'Failed to store uploaded evidence.' });
      }
    });
  };
}

module.exports = {
  single: makeUploadMiddleware
};
