var express = require('express');
var router = express.Router();
var request = require('request');
var rp = require('request-promise');
const sgMail = require('@sendgrid/mail');
var json2xls = require('json2xls');
var fs = require('fs');
var URL = require('url').URL;
var POLICY_FAILURE_URL = JSON.parse(fs.readFileSync("URLS.json"));
var config = JSON.parse(fs.readFileSync("config.json"));
sgMail.setApiKey(config.API_KEY);

var side;
var JS_REPORT_TEST = POLICY_FAILURE_URL.JS_REPORT_TEST;
var JS_REPORT = POLICY_FAILURE_URL.JS_REPORT;
router.get('/', function (req, res) {
    res.render('firstPage', {title: "Retry Failed"})
});

router.post('/', function (req, res) {
    res.render('finishPage', {status: "wait"});
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

    var policyFailureUrl = new URL(POLICY_FAILURE_URL.POLICY_FAILURE_WITH_VERSION_AND_DATE);
    var policySearchUrl = new URL(POLICY_FAILURE_URL.POLICY_SEARCH);
    // var policyFailureTestUrl = new URL((POLICY_FAILURE_URL.POLICY_FAILURE_TEST));
    // var policySearchTestUrl = new URL(POLICY_FAILURE_URL.POLICY_SEARCH_TEST);

    // console.log(policyFailureUrl.href);
    policyFailureUrl.searchParams.set('fromTime', startDate);
    policyFailureUrl.searchParams.set('toTime', endDate);
    policyFailureUrl.searchParams.set('monitorType', option);
    // console.log(policyFailureUrl.href);

    const failure = {
        method: 'GET',
        url: policyFailureUrl,
        json: true
    };

    rp(failure).then(function (response) {

        getFilteredPolicies(response, policySearchUrl).then(function (results) {

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
                        var policies = {"content": results};
                        // console.log(results)
                        var data = {
                            template: {
                                'shortid': 'rJBuafsIm'
                            },
                            data: policies
                        };

                        var options = {
                            url: JS_REPORT,
                            method: 'POST',
                            json: data
                        };

                        request(options).on('error', function (error) {
                            res.render('error', {error: error});
                        })
                            .pipe(fs.createWriteStream('Final policy failure.xlsx')).on('finish', function () {
                            // res.render('finishPage');
                            sendEmail(startDate, endDate, email);
                        })
                            .on('error', function (err) {
                                res.render('error', {error: err});
                                console.log(err.message);
                            });


                        console.log("finish write in file!!");
                    } else {
                        console.log('js report server is down, using the normal excel generation instead');
                        try {
                            var xls = json2xls(results,{fields:['id','partnerId','type','status','retryStatus','error']});
                            fs.writeFileSync('Final policy failure.xlsx', xls, 'binary');
                        } catch (error) {
                            console.log(error);
                            res.render('error');
                        }
                        sendEmail(startDate, endDate, email);

                        console.log("finish write in file!!");
                    }
                });
            testAPI.on('error', (e) => {
                console.error('problem with request: ' + e.message);
            });
            testAPI.end();

        }).catch(function (err) {
            console.log(err);
            res.render('error', {error: err});
        })

    }).catch(function (err) {
        console.log(err);
        res.render('error', {error: err});
    })

});

function getFilteredPolicies(policies, policySearchTestUrl) {

    return new Promise(async function (resolve, reject) {

        for (var i = 0; i < policies.length; i++) {
            var policy = policies[i];
            var policyNumber = extractPolicyNumber(policy.id);
            var type = policy.type;
            var policyDate = policy.time;


            policySearchTestUrl.searchParams.set('monitorType', type);
            policySearchTestUrl.searchParams.set('policyNumber', policyNumber);

            var search = {
                method: 'GET',
                url: policySearchTestUrl,
                json: true
            };

            // results.push(await getFinalResults(search, policy, policyDate));
            await getFinalResults(search, policy, policyDate).catch(function (err) {
                reject(err);
            })
        }
        resolve(policies)
    });

}

function getFinalResults(searchUrl, policy, policyDate) {
    return new Promise(function (resolve, reject) {

        request(searchUrl, function (err, res, body) {
            if (err) {
                reject(err)
            }
            else {
                var searchedPolicies = body.content; //an array of a specific policy with different histories
                // console.log(searchedPolicies);
                searchedPolicies.forEach(function (searchedPolicy) {
                    var id = searchedPolicy.id;

                    var policyNumber = extractPolicyNumberFromIdWithVersion(id);
                    var dateToCompare = extractTimeFromId(id);
                    var status = searchedPolicy.status;
                    // console.log(policyNumber);
                    // console.log(dateToCompare);
                    // console.log(status);
                    if (policyNumber === policy.id) {
                        if (compareDate(policyDate, dateToCompare)) {
                            if (status === 200) { // todo need to think about it
                                policy.retryStatus = true;
                            }
                        }
                    }

                });
                resolve(policy);
            }
            // console.log(policy);
        });

    });
}

function compareDate(policyDate, dateToCompare) {
    var date1 = parseDate(policyDate);
    var date2 = parseDate(dateToCompare);
    return date2 > date1;
}

function parseDate(date) {
    //todo 20180606-151641
    //todo 2018-06-06T15:16:41
    return date.slice(0, 4) + '-' + date.slice(4, 6) + '-' + date.slice(6, 8) + 'T' + date.slice(9, 11) + ':' + date.slice(11, 13) + ':' + date.slice(13, 15);
}


function extractPolicyNumberFromIdWithVersion(id) {
    //todo V20180801-061147.SEC854.FCM1159714-1-1@20180801-061148.041@20180801-061148.879
    var at = id.indexOf('@');
    var lastDot = id.substring(0, at).lastIndexOf('.');
    // var dash = id.substring(lastDot, at).indexOf('-');
    return id.substring(lastDot + 1, at);
}

function extractTimeFromId(id) {
    //todo M20180811-010737.BCA030.TMI3080755-5@20180811-014855.640
    // console.log(typeof id); string
    var lastDot = id.lastIndexOf('.');
    var lastAt = id.lastIndexOf('@');
    return id.substring(lastAt + 1, lastDot);
}

function extractPolicyNumber(policyNumberWithVersion) {
    var firstDash = policyNumberWithVersion.indexOf('-');
    return policyNumberWithVersion.substring(0, firstDash);
}

function sendEmail(start, end, email) {
    var data = fs.readFileSync('./Final policy failure.xlsx');

    const msg = {
        to: email,
        from: 'test@tugo.com',
        subject: 'Final policy transfer failures report from ' + start + ' to ' + end,
        text: 'Hi, ' +
        'The attachment contains the final version of policy transfer failures for ' + side + ' from ' + start + ' to ' + end,
        attachments: [
            {
                content: new Buffer(data).toString('base64'),
                filename: 'Final policy transfer failure ' + start + ' to ' + end + '.xlsx',
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                disposition: 'attachment'
            }
        ]
    };
    sgMail.send(msg, function (err, res) {
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