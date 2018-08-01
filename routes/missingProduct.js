var express = require('express');
var router = express.Router();
var request = require('request');
var rp = require('request-promise');
const sgMail = require('@sendgrid/mail');
var fs = require('fs');
var URL = require('url').URL;

var config = JSON.parse(fs.readFileSync("config.json"));

sgMail.setApiKey(config.API_KEY);

router.get('/', function (req, res, next) {
    var startDate = req.query.from;
    var endDate = req.query.to;

    var myUrl = new URL("https://blue-sellapi.tugo.com/monitor/api/list/report?monitorType=P2V-POLICY-TRANSFER-STATUS&fromTime=&toTime=");

    myUrl.searchParams.set('fromTime', startDate);
    myUrl.searchParams.set('toTime', endDate);
    console.log(myUrl.href);

    const external = {
        method: 'GET',
        url: myUrl,
        json: true
    };
    // console.log(external.url);
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
                    'shortid': 'ry8KRP0NQ'
                },
                data: finalResult
            };

            var options = {
                url: 'http://localhost:8001/api/report',
                method: 'POST',
                json: data
            };

            request(options)
                .pipe(fs.createWriteStream('missing product setup in Atlas.xlsx')).on('finish', function () {
                sendEmail(startDate, endDate);
                res.render('missingProduct', { title: 'Missing product setup in Atlas from ' + startDate + ' to ' + endDate + " send out" });
            })
                .on('error', function (err) {
                    console.log(err.message);
                });


            console.log("finish write in file!!");

        })
        .catch(function (error) {
            console.log(error)
        });

});


function sendEmail(start, end) {
    var data = fs.readFileSync('./missing product setup in Atlas.xlsx');

    const msg = {
        to: 'czha@tugo.com',
        from: 'test@tugo.com',
        subject: 'Missing product setup in Atlas ' + 'from ' + start + ' to ' + end,
        text: 'Missing product setup in Atlas',
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