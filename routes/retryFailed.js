var express = require('express');
var router = express.Router();
var request = require('request');
var rp = require('request-promise');

var fs = require('fs');
var URL = require('url').URL;
var POLICY_FAILURE_URL = JSON.parse(fs.readFileSync("URLS.json"));

router.get('/', function (req, res) {
    res.render('firstPage', {title: "Retry Failed"})
});

router.post('/', function (req, res) {
    console.log(req.body.Email);
    console.log(req.body.from);
    console.log(req.body.to);
    console.log(req.body.options);

    var startDate = req.body.from;
    var endDate = req.body.to;
    var email = req.body.Email;
    var option = req.body.options;
    side = option;

    if (option === 'Send both if not specified') {
        option = ''
    }
    side = sideDetection(side);

    var policyFailureUrl = new URL(POLICY_FAILURE_URL.POLICY_FAILURE);
    var policySearchUrl = new URL(POLICY_FAILURE_URL.POLICY_SEARCH);
    var policyFailureTestUrl = new URL((POLICY_FAILURE_URL.POLICY_FAILURE_TEST));
    var policySearchTestUrl = new URL(POLICY_FAILURE_URL.POLICY_SEARCH_TEST);

    // console.log(policyFailureUrl.href);
    policyFailureTestUrl.searchParams.set('fromTime', startDate);
    policyFailureTestUrl.searchParams.set('toTime', endDate);
    policyFailureTestUrl.searchParams.set('monitorType', option);
    // console.log(policyFailureUrl.href);

    const failure = {
        method: 'GET',
        url: policyFailureTestUrl,
        json: true
    };
    rp(failure).then(function (response) {
        var policies = response.content; //an array of policy failures
        policies.forEach(function (policy) {
            var policyNumber = policy.id;
            var type = policy.type;
            var policyDate = policy.time;

            policySearchTestUrl.searchParams.set('monitorType',type);
            policySearchTestUrl.searchParams.set('policyNumber',policyNumber);

            var search = {
                method: 'GET',
                url: policySearchTestUrl,
                json: true
            };
            request(search,function (err, res,body) {
                var searchedPolicies = body.content; //an array of a specific policy with different histories
                // console.log(searchedPolicies);
                searchedPolicies.forEach(function (searchedPolicy) {
                    var id = searchedPolicy.id;
                    // console.log(id);
                    var policyNumber = extractPolicyNumberFromId(id);
                    var dateToCompare = extractTimeFromId(id);
                    var status = searchedPolicy.status;
                    console.log(policyNumber);
                    console.log(dateToCompare);
                    console.log(status);
                    if(compareDate(policyDate,dateToCompare)){
                        if (status===200){ // todo need to think about it
                            policy.retryStatus = true;
                        }
                    }
                });

            });
        })

    })
});
function compareDate(policyDate,dateToCompare) {
//todo find a way to compare date
    return null;
}
function extractPolicyNumberFromId(id) {
    //todo V20180801-061147.SEC854.FCM1159714-1-1@20180801-061148.041@20180801-061148.879
    var at = id.indexOf('@');
    var lastDot = id.substring(0,at).lastIndexOf('.');
    var dash = id.substring(lastDot,at).indexOf('-');
    return id.substring(lastDot+1, lastDot + dash);
}

function extractTimeFromId(id) {
    //todo M20180811-010737.BCA030.TMI3080755-5@20180811-014855.640
    // console.log(typeof id); string
    var lastDot = id.lastIndexOf('.');
    var lastAt = id.lastIndexOf('@');
    return id.substring(lastAt+1, lastDot);
}

function sendEmail(start, end, email) {
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
    sgMail.send(msg, function (res, err) {
        if (err) {
            console.log(err);
            res.render('error', {error: err})
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