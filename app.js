var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

// var indexRouter = require('./routes/index');
var policyFailureReport = require('./routes/policyFailure');

var missingProduct = require('./routes/missingProduct');
var notFound = require('./routes/notFound');
var about = require('./routes/about');
var frequentError = require('./routes/frequent');
var errorGrouping = require("./routes/errorGrouping");
var retry = require("./routes/retryFailed");
var finishPage = require("./routes/finish");

// var PolicyFailure = require('./models/policyFailure');

var app = express();

//mongodb
mongoose.connect("mongodb://localhost/report");


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Body Parser Middleware
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);

// app.use('/policyFailure',policyFailureReport);
app.use('/', policyFailureReport);
app.use('/missingProduct',missingProduct);
app.use('/about',about);
app.use('/frequent',frequentError);
app.use("/errorGrouping",errorGrouping);
app.use("/retryFailed",retry);
app.use("/finish",finishPage);
app.use('*',notFound);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  var error = err;

  // render the error page
  res.status(err.status || 500);
  res.render('error',{error:error});
});

app.listen(3000,function () {
  console.log('Server started on port 3000...');
});

// PolicyFailure.create({
//     "id": "TMI3280810",
//     "partnerId": "BCA075",
//     "type": "P2V-POLICY-TRANSFER-STATUS",
//     "status": 200,
//     "error": "Error + Renew policy TMI3280810-1, however cannot find the corresponding source policy TMI3009675-5.. "
// },function (err,policy) {
//     if (err){
//         console.log(err)
//     }else{
//         console.log(policy)
//     }
// });

module.exports = app;
