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
var side;

/* GET users listing. */
router.get('/', function (req, res) {

    res.render('firstPage',{title: "Policy transfer report"});
    // res.render('finishPage')

});


router.post('/',function (req, res) {
    console.log(req.body.Email);
    console.log(req.body.from);
    console.log(req.body.to);
    console.log(req.body.options);

    var startDate = req.body.from;
    var endDate = req.body.to;
    var email = req.body.Email;
    var option = req.body.options;
    side = option;

    if (option==='Send both if not specified'){
        option = ''
    }
    side = sideDetection(side);

    var myUrl = new URL(POLICY_FAILURE_URL.POLICY_FAILURE);

    // console.log(myUrl.href);
    myUrl.searchParams.set('fromTime', startDate);
    myUrl.searchParams.set('toTime', endDate);
    myUrl.searchParams.set('monitorType',option);
    console.log(myUrl.href);


    const external = {
        method: 'GET',
        url: myUrl,
        json: true
    };
    // console.log(external.url);

    rp(external)
        .then(function (response) {

            var data = {
                template: {
                    'shortid': 'Bk3UUzsUX'
                },
                data: response
            };

            var options = {
                url: 'https://limitless-reef-70205.herokuapp.com/api/report',
                method: 'POST',
                json: data
            };

            request(options).on('error',function (error) {
                res.render('error', {error: error});
            })
                .pipe(fs.createWriteStream('policy failure.xlsx')).on('finish', function () {
                sendEmail(startDate, endDate, email);
                res.render('finishPage');
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
        })
});

  function sendEmail(start, end,email) {
    var data = fs.readFileSync('./policy failure.xlsx');

    const msg = {
        to: email,
        from: 'test@tugo.com',
        subject: 'Policy transfer failures report from ' + start + ' to ' + end,
        text: 'The attachment contains policy transfer failures for ' + side + ' from ' + start + ' to ' + end,
        attachments: [
            {
                content: new Buffer(data).toString('base64'),
                filename: 'Policy transfer failure ' + start + ' to ' + end + '.xlsx',
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                disposition: 'attachment'
            }
        ]
    };
    sgMail.send(msg, function (err,res) {
        if (err) {
            console.log(err);
            res.render('error',{error:err})
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