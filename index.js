var express = require('express');
var crypto = require('crypto');
var app = express();

var cache = {};

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

/* GET home page. */
app.get('/', function(request, response) {
  response.render('index', { title: 'Sync Server' });
});

app.get('/status', function(req, res, next) {
  res.render('status', { status: cache });
});

app.get('/discover', function(req, res, next) {
  var shasum = crypto.createHash('sha1');
  shasum.update(req.ip);
  var hash = shasum.digest('hex');
  if (hash in cache) {
    var now = Date.now();
    var timespan = now - cache[hash].timestamp;
    if (timespan < 60000) {
      res.jsonp(cache[hash]);
      return;
    }
  }
  cache[hash] = {
    hash: hash,
    source_ip: req.ip,
    inner_ips: req.query.ips,
    timestamp: Date.now()
  };
  res.jsonp({});
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
