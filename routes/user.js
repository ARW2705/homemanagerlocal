'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');

const User = require('../models/user');
const authenticate = require('../authenticate');

const userRouter = express.Router();

userRouter.use(bodyParser.json());

userRouter.route('/checkJWTToken')
  .get((req, res) => {
    passport.authenticate('jwt', {session: false}, (err, user, data) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        return res.json({status: 'JWT valid', success: true, user: user});
      }
    })(req, res);
  });

userRouter.route('/login')
  .post((req, res, next) => {
    passport.authenticate('local', (err, user, data) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, token: token, status: 'Successfully logged in'});
      }
    })(req, res, next);
  });

module.exports = userRouter;
