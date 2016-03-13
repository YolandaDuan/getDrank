var express = require('express');
var app = express();
var server = require('http').createServer(app);


app.use(express.static(__dirname));
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/accordion.html');
});
server.listen(process.env.PORT || 5000);


console.log("server is running...");