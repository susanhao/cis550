var http = require("http");
var url = require("url");
var fs = require("fs");
var mysql = require("mysql");
var mongo = require("mongodb").MongoClient;
var assert = require('assert');
var q = require('q');
var googleMapsClient = require('@google/maps').createClient({key: 'AIzaSyB1nUbkDzBuUweZs2YVNRrjPLfmiRFF0M0', Promise: q.Promise}); //AIzaSyAA6wJx2Go9j6dFU3ANJ5H8DBiwwDFAa0o
var map = Array.prototype.map;
var mongoURL = 'mongodb://localhost:27017/yelp';
var mongoCollectionName = 'yelpc';
var con = mysql.createConnection({
  host: "localhost",
  user: "admin",
  password: "admin",
  database: "cis550"
});
con.connect();

http.createServer(function(request, response) {
  var urlData = url.parse(request.url, true);
  var path = urlData.pathname;
  if(path === "/results") {
    var queryData = urlData.query;
    var queryString = 'select distinct Street_address from Restaurant_Inspection';
    var conditions = [];
    if("zip" in queryData && queryData.zip !== '') conditions.push('Zipcode = ' + queryData.zip);
    if("violations" in queryData && queryData.violations !== '') queryData.violations.split(/[\D]+/).forEach(function(num) {conditions.push('Restaurant_name in (select Restaurant_name from Restaurant_Inspection where violation_number = ' + num + ')')});
    if("comments" in queryData && queryData.comments !== '' && /[\w\d\s]*/.test(queryData.comments)) conditions.push('Violation_comment like \'%' + queryData.comments + '%\'');
    if(!("min_rating_amount" in queryData) || queryData.min_rating_amount === '') queryData.min_rating_amount = '0';
    if(!("max_rating_amount" in queryData) || queryData.max_rating_amount === '') queryData.max_rating_amount = '9999999';
    mongo.connect(mongoURL, function(err, db) {
      assert.equal(null, err);
      var collection = db.collection(mongoCollectionName);
      collection.find({'rating': {'$gte': parseFloat(queryData.min_rating_average), '$lte': parseFloat(queryData.max_rating_average)}, 'review_count': {'$gte': parseInt(queryData.min_rating_amount), '$lte': parseInt(queryData.max_rating_amount)}}).project({'_id': 0, 'address': 1}).toArray(function(err, docs) {
        assert.equal(err, null);
        conditions.push('Street_address in (\'' + map.call(docs, function(doc) {return doc.address.split('\'').join('\'\'');} ).join('\',\'') + '\')'); /*.replace(/\s+/," ")*/ /*replace('\'','\'\'')*/
        if(conditions.length != 0) queryString = queryString + ' where ' + conditions.join(' and ');
        con.query(queryString, function(err1, rows, fields) {
          if (err1) throw err1;
          fs.readFile('results.html', function(err2, data) {
            if (err2) throw err2;
            data = data.toString();
            q.all( map.call(rows, function(row) { return googleMapsClient.geocode({address: (row.Street_address + ', Philadelphia, PA')}).asPromise(); }) ).done(function(values) {
              var c = 0;
              markerText = map.call(values, function(value) { if(!("json" in value) || !("results" in value.json) || (value.json.results.length === 0) || !("geometry" in value.json.results[0]) || !("location" in value.json.results[0].geometry)) return ''; console.log(value); var l = value.json.results[0].geometry.location; c = c + 1; return '        var marker' + c + ' = new google.maps.Marker({position: {lat: ' + l.lat + ', lng: ' + l.lng + '}, map:map});'}).join('\n');
              dataFinal = data.replace('/*RESULTS GO HERE*/',markerText);
              response.writeHead(200, {"Content-Type": "text/html", 'Content-Length': dataFinal.length});
              response.write(dataFinal);
              response.end();
            });
          });
        });
        db.close();
      });
    });
  } else if(path === "/favicon.ico") {
    response.writeHead(204);
    response.end();
  } else if(path === "/search") {
    fs.readFile('search.html', function(err, data) {
      response.writeHead(200, {"Content-Type": "text/html", 'Content-Length': data.length});
      response.write(data);
      response.end();
    });
  } else if(path === "/") {
    data = "Please go to the <a href='/search'>Search Page</a>"
    response.writeHead(200, {"Content-Type": "text/html", 'Content-Length': data.length});
    response.write(data);
    response.end();
  } else {
    response.writeHead(404);
    response.end();
  }
}).listen(8888);