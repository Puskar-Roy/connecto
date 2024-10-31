const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Random Chat Server is running');
});


// router


module.exports = router;
