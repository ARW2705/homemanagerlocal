'use strict';

const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const passport = require('passport');

const mongoURL = process.env.MONGO_URL;
const connect = mongoose.connect(mongoURL);

const usersRouter = require('./routes/user');
const datetimeRouter = require('./routes/datetime');

connect.then(() => {
  const db = mongoose.connection;
  console.log('Database-Server connection established');
});

const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.initialize());

app.use('/users', usersRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/datetime', datetimeRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
