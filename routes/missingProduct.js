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

router.get('/', function (req, res) {

    res.render('firstPage', {title: "Missing products setup"})

});

router.post('/',function (req, res) {
    console.log(req.body.Email);
    console.log(req.body.from);
    console.log(req.body.to);

    var startDate = req.body.from;
    var endDate = req.body.to;
    var email = req.body.Email;

    var myUrl = new URL(POLICY_FAILURE_URL.POLICY_FAILURE);

    myUrl.searchParams.set('fromTime', startDate);
    myUrl.searchParams.set('toTime', endDate);
    console.log(myUrl.href);

    const external = {
        method: 'GET',
        url: myUrl,
        json: true
    };
    var result = [];

    rp(external)
        .then(function (response) {
            // console.log(response.content);
            for (var i = 0; i < response.content.length; i++) {
                if (response.content[i].error.toString().includes("PRODUCT_NOT_FOUND") || response.content[i].error.toString().includes("Product:")) {
                    result.push(response.content[i]);
                    console.log("Find it");
                }
            }
            // console.log(result);
            var finalResult = {"content" : result};
            // console.log(finalResult);

            var data = {
                template: {
                    'shortid': 'BJ8POGsL7'
                },
                data: finalResult
            };

            var options = {
                url: 'https://limitless-reef-70205.herokuapp.com/api/report',
                method: 'POST',
                json: data
            };

            request(options).on('error',function (error) {
                res.render('error', {error: error});
            })
                .pipe(fs.createWriteStream('missing product setup in Atlas.xlsx')).on('finish', function () {
                sendEmail(startDate, endDate,email);
                res.render('finishPage',{status:""});
            })
                .on('error', function (err) {
                    res.render('error', {error: err});
                    console.log(err.message);
                });


            console.log("finish write in file!!");

        })
        .catch(function (error) {
            res.render('error',{error: error});
            console.log(error)
        });

});


function sendEmail(start, end,email) {
    var data = fs.readFileSync('./missing product setup in Atlas.xlsx');

    const msg = {
        to: email,
        from: 'test@tugo.com',
        subject: 'Missing product setup in Atlas from ' + start + ' to ' + end,
        text: 'The attachment contains missing products setup in Atlas from ' + start + ' to ' + end,
        attachments: [
            {
                content: new Buffer(data).toString('base64'),
                filename: 'Missing product setup in Atlas from ' + start + ' to ' + end + '.xlsx',
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