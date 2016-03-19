
var mongodb = require("mongodb");
var MongoClient= mongodb.MongoClient;
  
var assert = require('assert');

var databaseUrl = "admin:admin@localhost:27017/tools_site_capture"; 
var collections = ["origin_captures", "diff_captures","tasks"];


var url = 'mongodb://localhost:27017/tools_site_capture';
MongoClient.connect(url, function(err, db) {
  //assert(null, err);
  console.log("Connected correctly to server.");
  
  var cursor = db.collection("origin_captures").find();
    
  cursor.each( function(err, item) {
    if(item){
      console.dir(item);  
    }else{
      console.log("over");
      db.close();
    }
    
  } );

  db.collection('origin_captures').insertOne({test:""}, function(err, result) {
    //assert.equal(err, null);
    console.log("Inserted a document into the restaurants collection.");
    //err?promise.reject(err):promise.resolve(data);
  });
  
});
/*

db.origin_captures.find({name: "img1"}, function(err, datas) {
  if( err || !users) console.log("No data found");
  else datas.forEach( function(item) {
    console.log(item);
  } );
});*/