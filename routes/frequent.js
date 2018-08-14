var express = require('express');
var router = express.Router();
var PolicyFailure = require('../models/policyFailure');
var request = require('request');
var rp = require('request-promise');
var fs = require('fs');
var URL = require('url').URL;

var POLICY_FAILURE_URL = JSON.parse(fs.readFileSync("URLS.json"));


router.get('/', function(req, res) {
    const external = {
        method: 'GET',
        url: "https://blue-sellapi.tugo.com/monitor/api/list/report?fromTime=2018-08-01&toTime=2018-08-02",
        json: true
    };

    rp(external)
        .then(function (res){

                // console.log(res.content[0]);
                var policies = res.content;
                policies.forEach(function (policy) {
                    PolicyFailure.create({
                        id: policy.id,
                        partnerId: policy.partnerId,
                        type: policy.type,
                        status: policy.status,
                        error: policy.error
                    })
                })



        }).then(function () {
            console.log('finish write in db!');
            res.render('finishPage');
    })
        .catch(function (error) {
        res.render('error',{error: error});
        console.log(error)
    })
});


module.exports = router;