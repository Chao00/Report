var express = require('express');
var router = express.Router();
var request = require('request');
var rp = require('request-promise');

/* GET users listing. */
router.get('/', function (req, res, next) {
    // res.render('policyReport', { title: 'Start generating report for policy transfer failures' });

    var jsonBody = {
        "content": [  {
            "id": "TMI3203071",
            "partnerId": "BCA075",
            "type": "P2V-POLICY-TRANSFER-STATUS",
            "status": 400,
            "error": "Error + Renew policy TMI3203071-2, however cannot find the corresponding source policy TMI3203071-1.. "
        }]};
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
                    'shortid': 'SJTQ-h8mm'
                },
                data: response
            };
            var options = {
                url: 'http://localhost:8001/api/report',
                method: 'POST',
                json: data
            };

            request(options).pipe(res);
        })
        .catch(function (error) {
            console.log(error)
        })


    // var data = {
    //     template: {
    //         'shortid': 'SJTQ-h8mm'
    //     },
    //     data: jsonBody
    // };
    // var options = {
    //     url: 'http://localhost:8001/api/report',
    //     method: 'POST',
    //     json: data
    // };
    //
    // request(options).pipe(res);

});


module.exports = router;