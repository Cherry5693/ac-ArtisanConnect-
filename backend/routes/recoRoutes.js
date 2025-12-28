const { Router } = require('express');
const { recommend } = require('../controllers/recoController');

const router = Router();
router.post('/reco', recommend);

module.exports = router;