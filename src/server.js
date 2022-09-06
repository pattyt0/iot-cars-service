var express = require('express');
var bodyParser = require('body-parser');
var Pusher = require('pusher');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var pusher = new Pusher({ appId: "1473622", key: "c430430aac7cd46ef3ad", secret:  "0de8ba650a032ab155a4", cluster: "sa1" });

app.post('/message', function(req, res) {
    var message = req.body.message;
    pusher.trigger( 'iot-cars-pusher-channel', 'message-added', { message });
    res.sendStatus(200);
});

app.get('/',function(req,res){
    res.sendFile('/public/index.html', {root: __dirname });
});

app.use(express.static(__dirname + '/public'));

var port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log(`app listening on port ${port}!`)
});
