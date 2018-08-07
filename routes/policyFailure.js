var express = require('express');
var router = express.Router();
var request = require('request');
var rp = require('request-promise');
const sgMail = require('@sendgrid/mail');
var fs = require('fs');
var URL = require('url').URL;

var config = JSON.parse(fs.readFileSync("config.json"));
var POLICY_FAILURE_URL = JSON.parse(fs.readFileSync("URLS.json"));

sgMail.setApiKey(config.API_KEY);

/* GET users listing. */
router.get('/', function (req, res, next) {

    res.render('firstPage');
//     res.render('finishPage')

});

router.post('/',function (req, res, next) {
    console.log(req.body.Email);
    console.log(req.body.from);
    console.log(req.body.to);
    console.log(req.body.options);

    var startDate = req.body.from;
    var endDate = req.body.to;
    var email = req.body.Email;

    var myUrl = new URL(POLICY_FAILURE_URL.POLICY_FAILURE);

    console.log(myUrl.href);
    myUrl.searchParams.set('fromTime', startDate);
    myUrl.searchParams.set('toTime', endDate);
    console.log(myUrl.href);


//todo make the data range dynamic

    const external = {
        method: 'GET',
        url: myUrl,
        json: true
    };
    console.log(external.url);

    rp(external)
        .then(function (response) {

            var data = {
                template: {
                    'shortid': 'ByEkbowSX'
                },
                data: response
            };

            var options = {
                url: 'http://localhost:8001/api/report',
                method: 'POST',
                json: data
            };

            request(options)
                .pipe(fs.createWriteStream('policy failure.xlsx')).on('finish', function () {
                sendEmail(startDate, endDate, email);
                res.render('finishPage');
            })
                .on('error', function (err) {
                    console.log(err.message);
                });


            console.log("finish write in file!!");

        })
        .catch(function (error) {
            console.log(error)
        })
});

  function sendEmail(start, end,email) {
    var data = fs.readFileSync('./policy failure.xlsx');

    const msg = {
        to: email,
        from: 'test@tugo.com',
        subject: 'Policy transfer failures report from ' + start + ' to ' + end,
        text: 'The attachment contains policy transfer failures for both sides from ' + start + ' to ' + end,
        attachments: [
            {
                content: new Buffer(data).toString('base64'),
                filename: 'Policy transfer failure ' + start + ' to ' + end + '.xlsx',
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                disposition: 'attachment'
            }
        ]
    };
    sgMail.send(msg, function (err) {
        if (err) {
            console.log(err);
        }
        console.log("Email sent")

    });

}


module.exports = router;