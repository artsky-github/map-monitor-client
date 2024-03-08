const { MongoClient } = require("mongodb");
const os = require("os");

const uri = "mongodb://localhost:27017"; // local uri for testing
const mapStatuses = new MongoClient(uri).db("mydb").collection("mapStatuses");
async function add(obj) {
    const hasOne = await mapStatuses.findOne({_id : os.hostname()});
    if (hasOne) {
        await mapStatuses.replaceOne({_id : os.hostname()}, obj);
    } else {
        await mapStatuses.insertOne(obj);
    }
}

module.exports = {add};
