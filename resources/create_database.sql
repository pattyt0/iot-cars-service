-- Database: iot-cars

-- DROP DATABASE IF EXISTS "iot-cars";

CREATE DATABASE iotcarsdb;

CREATE TABLE IF NOT EXISTS sensors (
   id serial PRIMARY KEY,
   name VARCHAR(150) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS readings (
   id serial PRIMARY KEY,
   sensor_id INT NOT NULL,
   creation_time TIMESTAMP,
   value real,
   entry_id INT,
   FOREIGN KEY (sensor_id) REFERENCES sensors(id)
);