var express = require('express');
var router = express.Router();
var request = require('request');
var rp = require('request-promise');
const sgMail = require('@sendgrid/mail');
var fs = require('fs');

var config = JSON.parse(fs.readFileSync("config.json"));

sgMail.setApiKey(config.API_KEY);

/* GET users listing. */
router.get('/', function (req, res, next) {

    // res.render('policyReport', { title: 'Start generating report for policy transfer failures' });

    // var jsonBody = {
    //     "content": [  {
    //         "id": "TMI3203071",
    //         "partnerId": "BCA075",
    //         "type": "P2V-POLICY-TRANSFER-STATUS",
    //         "status": 400,
    //         "error": "Error + Renew policy TMI3203071-2, however cannot find the corresponding source policy TMI3203071-1.. "
    //     }]};

//     var startDate = req.query.from;
//     var endDate = req.query.end;
//
// //todo make the data range dynamic

    const external = {
        method: 'GET',
        url: 'https://blue-sellapi.tugo.com/monitor/api/list/report?fromTime=2018-05-01&toTime=2018-05-02',
        json: true
    };

    rp(external)
        .then(function (response) {
            // console.log(response)
            var data = {
                template: {
                    'shortid': 'HkE-q8AQQ'
                },
                data: response
            };
            var options = {
                url: 'http://localhost:8001/api/report',
                method: 'POST',
                json: data
            };

            // request(options).pipe(res);
           request(options).on('response',function (response) {
               // console.log(response.content)
               // sendEmail(response)
           }).on('error',function (err) {
               console.log(err.message);
           }).pipe(res);

        })
        .catch(function (error) {
            console.log(error)
        })

    sendEmail();

});

function sendEmail (){
    var data = fs.readFileSync('./Policy transfer failure (3).xlsx');
    // console.log(data);
    const msg = {
        to: 'czha@tugo.com',
        from: 'test@tugo.com',
        subject: 'Sending with SendGrid is Fun',
        text: 'lalalallalala',
        attachments:[
            {
                content: new Buffer(data).toString('base64'),
                filename: 'Policy transfer failure.xlsx',
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                disposition: 'attachment'
            }
        ]
    };
    sgMail.send(msg,function (err) {
        if (err){
            console.log(err);
        }console.log("sent")

    });

}


module.exports = router;