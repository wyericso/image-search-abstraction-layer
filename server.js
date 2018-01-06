// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var https = require('https');
var fs = require('fs');
var latestSearches = [];
fs.readFile('latestsearch.json', (err, data) => {
  if (err) throw err;
  latestSearches = JSON.parse(data);
});
setInterval(() => {
  fs.writeFile('latestsearch.json', JSON.stringify(latestSearches), (err) => {
    console.log('latestSearches saved at ', new Date().toISOString());
  });
}, 1000 * 60 * 10);

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/dreams", function (request, response) {
  response.send(dreams);
});

// could also use the POST body instead of query string: http://expressjs.com/en/api.html#req.body
app.post("/dreams", function (request, response) {
  dreams.push(request.query.dream);
  response.sendStatus(200);
});

app.get("/api/imagesearch/:search", (req, res) => {
  var googleURL = 
      'https://www.googleapis.com/customsearch/v1?q=' + encodeURI(req.params.search) +
      '&cx=' + process.env.CX + '&key=' + process.env.KEY + '&searchType=image' +
      (req.query.offset ? '&start=' + (parseInt(req.query.offset, 10) + 1).toString() : '');
  https.get(googleURL, (resFromGoogle) => {
    let rawData = '';
    resFromGoogle.on('data', (chunk) => {
      rawData += chunk;
    });
    resFromGoogle.on('end', () => {
      var returnedObjArr = JSON.parse(rawData).items;
      var trimmedArr = returnedObjArr.map((elem) => {
        return {'url': elem.link,
               'snippet': elem.snippet,
               'thumbnail': elem.image.thumbnailLink,
               'context': elem.image.contextLink};
      });
      latestSearches.unshift({
        'term': req.params.search,
        'when': new Date().toISOString()
      });
      latestSearches = latestSearches.slice(0, 10);
      res.end(JSON.stringify(trimmedArr));
    });
  });
});

app.get("/api/latest/imagesearch", (req, res) => {
  res.end(JSON.stringify(latestSearches));
});

// Simple in-memory store for now
var dreams = [
  "Find and count some sheep",
  "Climb a really tall mountain",
  "Wash the dishes"
];

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
