var express = require('express');
var router = express.Router();
var request = require('request');
var rp = require('request-promise');
const sgMail = require('@sendgrid/mail');
var fs = require('fs');
var URL = require('url').URL;
// var dateFormat = require('dateformat');

var config = JSON.parse(fs.readFileSync("config.json"));
var POLICY_FAILURE_URL = JSON.parse(fs.readFileSync("URLS.json"));
var side;

sgMail.setApiKey(config.API_KEY);

/* GET users listing. */
router.get('/', function (req, res) {

    res.render('firstPage', {title: "Error grouping"});

});

router.post('/', function (req, res) {
    var startDate = req.body.from;
    var endDate = req.body.to;
    var email = req.body.Email;
    var option = req.body.options;
    side = option;

    if (option === 'Send both if not specified') {
        option = ''
    }
    side = sideDetection(side);

    var myUrl = new URL(POLICY_FAILURE_URL.ERROR_GROUPING);

    var parsedDate = new Date(Date.parse(startDate)).toString();

    var lastIndex = parsedDate.lastIndexOf('-');
    console.log(parsedDate.substring(lastIndex+1,lastIndex+5));
    var timeZone = parsedDate.substring(lastIndex+1,lastIndex+5);

    var start = new Date(startDate).toISOString();
    var end = new Date(endDate).toISOString();
    start = start.replace('.','-').substring(0,start.length-4).concat(timeZone);//format the date to ie:2018-08-13T10:46:05-0700
    end = end.replace('.','-').substring(0,end.length-4).concat(timeZone);

    console.log(start);
    console.log(end);

    myUrl.searchParams.set('fromTime', start);
    myUrl.searchParams.set('toTime', end);
    myUrl.searchParams.set('monitorType', option);
    console.log(myUrl.href);


    const external = {
        method: 'GET',
        url: myUrl,
        json: true
    };

    rp(external)
        .then(function (response) {

            var data = {
                template: {
                    'shortid': 'SkWMtGjL7'
                },
                data: response
            };

            var options = {
                url: 'https://limitless-reef-70205.herokuapp.com/api/report',
                method: 'POST',
                json: data
            };

            request(options).on('error', function (error) {
                res.render('error', {error: error});
            })
                .pipe(fs.createWriteStream('errorGrouping.xlsx')).on('finish', function () {
                sendEmail(startDate,endDate,email);
                res.render('finishPage',{status:""});
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
        })
});

function sendEmail(start, end, email) {
    var data = fs.readFileSync('./errorGrouping.xlsx');

    const msg = {
        to: [email],
        from: 'test@tugo.com',
        subject: 'Error grouping from' + start + ' to ' + end,
        text: 'The attachment contains error grouping report for ' + side + ' from '+ start + ' to ' + end,
        attachments: [
            {
                content: new Buffer(data).toString('base64'),
                filename: 'Error grouping.xlsx',
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                disposition: 'attachment'
            }
        ]
    };
    sgMail.send(msg, function (err, res) {
        if (err) {
            console.log(err);
        }
        console.log("Email sent")

    });
}

function sideDetection(side) {
    if (side === 'P2V-POLICY-TRANSFER-STATUS') {
        side = 'P2V'
    } else if (side === 'V2P-POLICY-TRANSFER-STATUS') {
        side = 'V2P'
    } else {
        side = 'both sides'
    }
    return side;
}

module.exports = router;