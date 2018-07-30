var express = require('express');
var router = express.Router();
var request = require('request');
var rp = require('request-promise');
const sgMail = require('@sendgrid/mail');
var fs = require('fs');
var url = require('url');

var config = JSON.parse(fs.readFileSync("config.json"));

sgMail.setApiKey(config.API_KEY);

/* GET users listing. */
router.get('/', function (req, res, next) {

    // var startDate = req.query.from;
    // var endDate = req.query.end;
    //
    // var adr = 'https://blue-sellapi.tugo.com/monitor/api/list/report?fromTime=2008-08-06&toTime=2009-08-08';
    // var myUrl = url.parse(adr,true);
    //
    //
    // console.log(myUrl.query.fromTime);
    // console.log(myUrl.query.toTime);
    // console.log(myUrl.search);

//
//todo make the data range dynamic

    const external = {
        method: 'GET',
        url: 'https://blue-sellapi.tugo.com/monitor/api/list/report?fromTime=2018-05-01&toTime=2018-05-03',
        json: true
    };
    console.log(external.url);

    rp(external)
        .then(function (response) {
            // console.log(response)
            var data = {
                template: {
                    'shortid': 'SJ0vnAh4X'
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
           }).pipe(fs.createWriteStream('policy failure.xlsx'),sendEmail());

           console.log("finish write in file!!");

        })
        .catch(function (error) {
            console.log(error)
        })

});

function sendEmail (){
    var data = fs.readFileSync('./policy failure.xlsx');
    console.log(data);
    const msg = {
        to: 'czha@tugo.com',
        from: 'test@tugo.com',
        subject: 'Policy transfer failure report',
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
        }console.log("Email sent")

    });

}


module.exports = router;