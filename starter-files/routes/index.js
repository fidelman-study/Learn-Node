const express = require('express');
const router = express.Router();
/* controllers */
const storeController = require('../controllers/storeController');
/* helpers */
const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
router.get('/', storeController.myMiddleware, storeController.homePage);
router.get('/add', storeController.addStore);
router.post('/add', catchErrors(storeController.createStore));

module.exports = router;