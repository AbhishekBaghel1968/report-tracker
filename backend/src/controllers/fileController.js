const path = require('path');
const fs = require('fs');
require('dotenv').config();

const uploadDir = process.env.UPLOAD_DIR || './uploads';

async function downloadFile(req, res) {
  try {
    const { fileName } = req.params;
    const resolvedPath = path.resolve(uploadDir, fileName);

    // Prevent path traversal attacks
    if (!resolvedPath.startsWith(path.resolve(uploadDir))) {
      return res.status(400).json({ error: 'Invalid file name' });
    }

    if (fs.existsSync(resolvedPath)) {
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      return res.sendFile(resolvedPath);
    } else {
      return res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Download file error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  downloadFile,
};
