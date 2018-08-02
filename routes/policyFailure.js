var express = require('express');
var router = express.Router();
var request = require('request');
var rp = require('request-promise');
const sgMail = require('@sendgrid/mail');
var fs = require('fs');
var URL = require('url').URL;

var config = JSON.parse(fs.readFileSync("config.json"));

sgMail.setApiKey(config.API_KEY);

/* GET users listing. */
router.get('/', function (req, res, next) {

    var startDate = req.query.from;
    var endDate = req.query.to;

    var myUrl = new URL("https://blue-sellapi.tugo.com/monitor/api/list/report?fromTime=&toTime=");

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
                    'shortid': 'BJFAdngHm'
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
                sendEmail(startDate, endDate);
                res.render('policyFailure', { title: 'Policy failure report from ' + startDate + ' to ' + endDate + " send out" });
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

  function sendEmail(start, end) {
    var data = fs.readFileSync('./policy failure.xlsx');

    const msg = {
        to: 'mliu@tugo.com',
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