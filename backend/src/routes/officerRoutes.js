const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officerController');
const officerAuth = require('../middleware/officerAuth');
const upload = require('../middleware/upload');

// Protect all officer routes
router.use(officerAuth);

router.get('/stats', officerController.getDashboardStats);
router.get('/cases', officerController.getAssignedCases);
router.get('/cases/:id', officerController.getCaseDetails);
router.put('/case/:id/status', officerController.updateCaseStatus);
router.post('/notes/:caseId', officerController.addOfficerNote);
router.post('/upload', upload.single('file'), officerController.uploadEvidence);

module.exports = router;
