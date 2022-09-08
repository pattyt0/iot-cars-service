let express = require('express');
let mqtt = require('mqtt');
let dotenv = require('dotenv');
let {Client} = require('pg');
const http = require('http').createServer(express);
const io = require('socket.io')(http);


// let app = express();
let port = process.env.PORT || 5000;

dotenv.config();

let mqttOptions = {
    protocolId: process.env.MQTT_PROTOCOL_ID,
    port: process.env.MQTT_PORT,
    clientId: process.env.MQTT_CLIENT_ID,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clean: true
};
const pgClient = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
});
const topicSubscribe = process.env.MQTT_TOPIC_SUBSCRIBE;
(async () => {
        const VIBRATION_SENSOR = 1;
        const SPEED_SENSOR = 2;

        io.on('connect', socket => {
            // either with send()
            socket.send('Hello!');

            // or with emit() and custom event names
            socket.emit('greetings', 'Hey!', { 'ms': 'jane' }, Buffer.from([4, 3, 3, 1]));

            // handle the event sent with socket.send()
            socket.on('message', (data) => {
                console.log(data);
            });

            // handle the event sent with socket.emit()
            socket.on('salutations', (elem1, elem2, elem3) => {
                console.log(elem1, elem2, elem3);
            });
        });

        pgClient.connect();
        const mqttClient = mqtt.connect('mqtt://mqtt3.thingspeak.com', mqttOptions);

        mqttClient.on('connect', function () {
            console.log("connected Mqtt broker " + mqttClient.connected);
        });

        mqttClient.subscribe(topicSubscribe, {'qos': 0}, (err) => {
            if (!err) {
                mqttClient.publish(topicSubscribe, JSON.stringify({'mqttClient.subscribe': topicSubscribe}));
            } else {
                console.log("could not subscribe to " + topicSubscribe, err);
            }
        });

        mqttClient.on('message', async (topic, message) => {
            const msg = JSON.parse(message.toString());
            console.log("mqttClient.on message: ", msg, " from topic ", topic);
            console.log('topic is ', topic);

            let readings = []
            let reading = {
                'sensorId': null,
                'creationTime': null,
                'sensorValue': null,
                'entryId': null
            }
            if (msg['field1']) {
                reading.sensorId = VIBRATION_SENSOR;
                reading.creationTime = msg['created_at'];
                reading.sensorValue = msg['field1'];
                reading.entryId = msg['entry_id'];

                readings.push(reading)
            }
            if (msg['field2']) {
                reading.sensorId = SPEED_SENSOR;
                reading.creationTime = msg['created_at'];
                reading.sensorValue = msg['field2'];
                reading.entryId = msg['entry_id'];

                readings.push(reading)
            }

            for (let i = 0; i < readings.length; i++) {
                try {
                    let read = readings[i]
                    console.log('PG read: ', read)
                    await pgClient.query('BEGIN')
                    let queryText = 'INSERT INTO readings(sensor_id,creation_time,value,entry_id) VALUES($1,$2,$3,$4) RETURNING *'
                    pgClient.query(queryText, [read.sensorId, read.creationTime, read.sensorValue, read.entryId],
                        (err, res) => {
                            if (!err) {
                                let row = res.rows[0];
                                console.log('PG saved: ', row)
                                io.emit('private message', JSON.stringify(row));
                            } else {
                                console.log('PG saving error: ', err)
                            }
                        })
                    await pgClient.query('COMMIT')
                } catch (e) {
                    await pgClient.query('ROLLBACK')
                    throw e
                }
                // } finally {
                //     pgClient.release()
                // }
            }

            console.log("will broadcast", msg);
            // io.emit('my broadcast', msg);
        });

        mqttClient.on('error', (error) => {
            console.log("Can't connect" + error);
            process.exit(1);
        });

        mqttClient.on('close', () => {
            console.log('mqtt client closed');
        });

// app.use(express.static(__dirname + '/public'));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: false}));
        http.listen(port, () => {
            console.log(`app listening on port ${port}!`)
        });
    }
)().catch(e => console.error("error ", e.stack))
