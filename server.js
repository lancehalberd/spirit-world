var express = require(`express`);


var app = express();

var PORT = process.env.PORT || 3000;


// local external files
app.use(express.static('public'));

// Starts the server to begin listening
// =============================================================
var server = app.listen(PORT, function() {
  console.log("App listening on PORT " + PORT);
});