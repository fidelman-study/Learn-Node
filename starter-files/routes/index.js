const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
  const obj = { x: 1, y: 3 };
  res.json(obj);
});

module.exports = router;