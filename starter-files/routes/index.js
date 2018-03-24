const express = require('express');
const router = express.Router();
/* controllers */
const storeController = require('../controllers/storeController');

// Do work here
router.get('/', storeController.myMiddleware, storeController.homePage);
router.get('/add', storeController.addStore);
router.post('/add', storeController.createStore);

module.exports = router;