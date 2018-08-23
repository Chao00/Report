var express = require('express');
var router = express.Router();
var request = require('request');
var rp = require('request-promise');
const sgMail = require('@sendgrid/mail');
var fs = require('fs');
var URL = require('url').URL;
var json2xls = require('json2xls');

var config = JSON.parse(fs.readFileSync("config.json"));
var POLICY_FAILURE_URL = JSON.parse(fs.readFileSync("URLS.json"));
var JS_REPORT_TEST = POLICY_FAILURE_URL.JS_REPORT_TEST;
var JS_REPORT = POLICY_FAILURE_URL.JS_REPORT;

sgMail.setApiKey(config.API_KEY);

router.get('/', function (req, res) {

    res.render('firstPage', {title: "Missing products setup"})

});

router.post('/', function (req, res) {
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

    var http = require('http'),
        url = require('url'),
        options = {
            method: 'HEAD',
            host: url.parse(JS_REPORT_TEST).host,
            port: 80,
            path: url.parse(JS_REPORT_TEST).pathname
        },
        testAPI = http.request(options, function (r) {
            jsReport = JSON.stringify(r.statusCode);
            console.log(jsReport);
            if (jsReport === '200') {
                console.log('js report server is up, using js report to generate excel');
                rp(external)
                    .then(function (response) {
                        // console.log(response.content);
                        for (var i = 0; i < response.content.length; i++) {
                            if (response.content[i].error.toString().includes("PRODUCT_NOT_FOUND") || response.content[i].error.toString().includes("Product:")) {
                                result.push(response.content[i]);
                                // console.log("Find it");
                            }
                        }
                        var finalResult = {"content": result};

                        var data = {
                            template: {
                                'shortid': 'BJ8POGsL7'
                            },
                            data: finalResult
                        };

                        var options = {
                            url: JS_REPORT,
                            method: 'POST',
                            json: data
                        };

                        request(options).on('error', function (error) {
                            res.render('error', {error: error});
                        })
                            .pipe(fs.createWriteStream('missing product setup in Atlas.xlsx')).on('finish', function () {
                            sendEmail(startDate, endDate, email);
                            res.render('finishPage', {status: ""});
                        })
                            .on('error', function (err) {
                                res.render('error', {error: err});
                                console.log(err.message);
                            });


                        console.log("finish write in file!!");

                    })
                    .catch(function (error) {
                        res.render('error', {error: error});
                        console.log(error)
                    });
            } else {
                console.log('js report server is down, using the normal excel generation instead');
                rp(external)
                    .then(function (response) {
                        // console.log(response.content);
                        for (var i = 0; i < response.content.length; i++) {
                            if (response.content[i].error.toString().includes("PRODUCT_NOT_FOUND") || response.content[i].error.toString().includes("Product:")) {
                                result.push(response.content[i]);
                            }
                        }
                        try {
                            var xls = json2xls(result,{fields:['id','partnerId','error']});
                            fs.writeFileSync('missing product setup in Atlas.xlsx', xls, 'binary');
                        }catch (error){
                            console.log(error);
                            res.render('error');
                        }
                        sendEmail(startDate, endDate, email);
                        res.render('finishPage', {status: ""});

                        console.log("finish write in file!!");

                    })
                    .catch(function (error) {
                        res.render('error', {error: error});
                        console.log(error)
                    });
            }
        });
    testAPI.on('error', (e) => {
        console.error('problem with request: ' + e.message);
    });
    testAPI.end();
});


function sendEmail(start, end, email) {
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