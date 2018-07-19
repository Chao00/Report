var fs = require('fs');
var express = require('express');
var router = express.Router();
const sgMail = require('@sendgrid/mail');

var config = JSON.parse(fs.readFileSync("config.json"));

sgMail.setApiKey(config.API_KEY);

router.get('/', function(req, res, next) {
    // res.send('respond with a resource');
    const msg = {
        to: 'czha@tugo.com',
        from: 'test@tugo.com',
        subject: 'Sending with SendGrid is Fun',
        text: 'and easy to do anywhere, even with Node.js',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    };
    sgMail.send(msg,function (err) {
        if (err){
            console.log(err);
        }res.send('Email sent successfully')
        
    });

});


module.exports = router;
