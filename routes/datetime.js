'use strict';

const express = require('express');

const authenticate = require('../authenticate');

const dateTimeRouter = express.Router();

dateTimeRouter.route('/')
  .get(authenticate.verifyUser, (req, res, next) => {
    const now = parseInt(Date.now() / 1000);
    console.log(now);
    const datetime = {
      unix: now
    };
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(datetime);
  });

module.exports = dateTimeRouter;
