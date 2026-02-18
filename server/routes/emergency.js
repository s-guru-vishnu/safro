const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { triggerSOS } = require('../controllers/emergencyController');

router.post('/sos', auth, triggerSOS);

module.exports = router;
