const express = require('express');
const router = express.Router();
/* controllers */
const storeController = require('../controllers/storeController');

// Do work here
router.get('/', storeController.myMiddleware, storeController.homePage);

module.exports = router;