const { MongoClient } = require("mongodb");
const os = require("os");

const uri = "mongodb://localhost:27017"; // local uri for testing
const mapStatuses = new MongoClient(uri).db("MapStatusDB").collection("active");

async function insert(obj) {
  console.log("Added to the DB");
  const hasOne = await mapStatuses.findOne({ _id: os.hostname() });
  if (hasOne) {
    await mapStatuses.replaceOne({ _id: os.hostname() }, obj);
  } else {
    await mapStatuses.insertOne(obj);
  }
}

async function statusExists() {
  return (await mapStatuses.findOne({ _id: os.hostname() })) !== null;
}

async function getStatus() {
  return await mapStatuses.findOne({ _id: os.hostname() });
}

module.exports = { insert, statusExists, getStatus };
