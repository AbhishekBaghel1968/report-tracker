const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

router.get('/:fileName', fileController.downloadFile);

module.exports = router;
