var mongoose = require("mongoose");

var policyFailureSchema = new mongoose.Schema({
    id: String,
    partnerId: String,
    type: String,
    status: Number,
    error: String
});

module.exports = mongoose.model("PolicyFailure", policyFailureSchema);