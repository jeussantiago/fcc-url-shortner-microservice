'use strict';
//get requirements
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
//information from forms
var bodyParser = require('body-parser');
var cors = require('cors');


/** this project needs a db !! **/ 
//connect to mongo database
// mongoose.Promise = global.Promise;
// mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.MONGOLAB_URI);

var app = express();
app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
//so that app can read information from form
app.use((bodyParser.urlencoded({encoded: false, extended: true})))


app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});






//create schema
const Schema = mongoose.Schema;
const url_shortner_schema = new Schema({
  original_url: String,
  short_url: String
}, {timestamp: true})
//create model out of schema
const url_model = mongoose.model("shortened_url", url_shortner_schema);

//url parser - where the form sends its information - saves information inside of mongoDB
app.post("/api/shorturl/new", function(req, res) {
  //get user url
  var user_url = req.body.url;
  //regular expression for validating a url
  var regex_exp_valid_url = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
  //test url for validitity
  if ( !regex_exp_valid_url.test(user_url) ) {
    console.log("invalid url")
    //invalid URL
    res.json({
      error: "invalid URL"
    })
  } else {
    console.log("valid url")
    //valid URL 
    //create random number for shortened url
    var ran_num = Math.floor(Math.random()*10000).toString();
    //create data object with mongo schema  
    var data = new url_model({
      original_url: user_url,
      short_url: ran_num
    });
    //save information to database
    data.save(function (err, data) {
      if (err) return res.send("Error saving to database")
    });
    //see if info saved to db
    res.json(data)
  }
})


//api/shorturl/6438
//query mongoDB for shortcut url and redirect to corresponding link
app.get("/api/shorturl/:new", function(req, res) {
  //get short url 
  var short_url = req.params.new;
  console.log("enter short url:", short_url)
  //query db for short url
  url_model.findOne({short_url: short_url}, (err, data) => {
    if (err) return res.send("Error finding short url in database")
    //get original url
    var original_url = data.original_url;
    var regex_valid_url = "^(http|https)://"
    if( regex_valid_url.test(original_url) ) {
      //redirect to other url
      res.redirect(301, data.original_url)
    } else {
      res.redirect(301, "http://" + data.original_url)
    }
  })
})





// Basic Configuration 
var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Node.js listening ...');
});