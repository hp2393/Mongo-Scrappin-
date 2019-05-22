// Dependencies
var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");


// Scraping tools
var cheerio = require("cheerio");
var request = require("request");

// Require all models
var db = require("./models");

// Initialize Express
var PORT = process.env.PORT || 3000;

var app = express();

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI,{ useNewUrlParser: true });
mongoose.set("useFindAndModify", false);


// Configure middleware
// Use morgan logger for logging requests
app.use(logger("dev"));

// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

app.get("/", function(req, res) {
  res.send(index.html);
});


// A GET route for scraping the invision blog
app.get("/scrape", function(req, res) {
  
  request("http://www.philly.com/sports/", function(error, response, html) {
    
    var $ = cheerio.load(html);

    $(".img.b-lazy").each(function(i, element) {
      var title = $(element).attr('alt');
      var link = $(element).parent('a').attr('href');
      var img = $(element).attr('src');

      var result = {
        title: title,
        link: link,
        image: img,
        saved: false
      }
      
      console.log(result);
      
      db.Article.findOne({title:title}).then(function(data) {
        
        console.log(data);

        if(data === null) {

          db.Article.create(result).then(function(dbArticle) {
            res.json(dbArticle);
          });
        }
      }).catch(function(err) {
          res.json(err);
      });

    });

  });
});

res.send("Scrape Complete")
// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  
  db.Article
    .find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {

  db.Article
    .findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {

  db.Note
    .create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating article to be saved
app.put("/saved/:id", function(req, res) {

  db.Article
    .findByIdAndUpdate({ _id: req.params.id }, { $set: { saved: true }})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for getting saved article
app.get("/saved", function(req, res) {

  db.Article
    .find({ saved: true })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for deleting/updating saved article
app.put("/delete/:id", function(req, res) {

  db.Article
    .findByIdAndUpdate({ _id: req.params.id }, { $set: { saved: false }})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});


// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});