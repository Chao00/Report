# Auto Report Generation
## Description
The purpose of this project is to generate four different types of error report for policy sync between Atlas and Phoenix.  
1.Policy failure general report:   
The resulting excel:   


##Prerequisites
* Make sure you have node.js and npm installed.
    * Go to https://nodejs.org/en/download/
    * npm comes with node.js
    * Once finish install node.js, you can run the command ` node -v ` and ` npm -v ` to check the version, if it show you the correct version then you are down with the installation.
   
##Installation

```shell
git clone https://[userName]@bitbucket.org/tugo/atlas-policy-integ-report.git
cd atlas-policy-integ-report
npm install
npm start
```
The application will be started at port 3000 if the environment variable 'PORT' is not being set.    
Port can also be configured using command `PORT=3000 npm start`
##Technology
* Node.js  npm
* Express
* jsreport https://jsreport.net/
* Bootstrap4 https://getbootstrap.com/

##Dependencies
* sendgrid: Email provider https://app.sendgrid.com/
    * 100 emails per day
* jsreport: Report provider https://jsreport.net/
* Heroku: Cloud platform for deploying jsreport https://dashboard.heroku.com

##Contributor
Chao Zhang


   