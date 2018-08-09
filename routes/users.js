var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.render('notFound');
});

router.post("/", function (req, res, next) {

    console.log(req.body.Email);
    console.log(req.body.from);
    console.log(req.body.to);
    console.log(req.body.options);

});

module.exports = router;
