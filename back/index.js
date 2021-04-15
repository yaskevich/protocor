'use strict';

import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import express from 'express';
import compression from 'compression';
import bodyParser from 'body-parser';
import passport from 'passport';
import passportJWT from "passport-jwt";
import jwt from 'jsonwebtoken';
import axios from 'axios';
// import db from './db.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
	const app = express();
	const port = process.env.PORT || 3061;
	const JWTStrategy   = passportJWT.Strategy;
	const ExtractJWT = passportJWT.ExtractJwt;

	const createToken = (user) => {
	  return jwt.sign({
	    iss: 'yaskevich',
	    sub: user.id,
	    iat: new Date().getTime(),
	    exp: new Date().setDate(new Date().getDate() + 1)
	  }, process.env.JWT_SECRET);
	};

	const strategy  = new JWTStrategy({
		  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
		  secretOrKey   : process.env.JWT_SECRET
		}, function (jwtPayload, done) {
		  return db.getUserDataByID(jwtPayload.sub)
		    .then(user => { return done(null, user); })
			  .catch(err => { return done(err); });
		});

	passport.use(strategy);
	const auth = passport.authenticate('jwt', {session: false});
	// app.use(compression());
	// app.set('trust proxy', 1);
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(express.static('public'));

	app.post('/api/login', async(req, res) => {
		// const userData = await db.getUserData(req.body["email"], req.body["password"]);
		// if (userData && Object.keys(userData).length && !userData.hasOwnProperty("error") ) {
		// 	console.log(req.body["email"], "<SUCCESS>");
		// 	const token = createToken(userData);
		// 	userData["token"] = token;
		// 	res.json(userData);
		// } else {
		// 	console.log(`login attempt as [${req.body["email"]}]•[${req.body["password"]}]►${userData.error}◄`);
		// 	res.json(userData);
		// }
	});

	app.get('/api/logout', (req, res) => {
		console.log("logging out");
		// You can add "issue time" to token and maintain "last logout time" for each user on the server.
		// When you check token validity, also check "issue time" be after "last logout time".
		// res.redirect('/login');
	});

	app.get('/api/test', (req, res) => {
		res.json({ "message": "ok" });
	});

	app.post('/api/query', async(req, res) => {
		console.log("POST", req.body);
		if (req.body.token) {
			const params = {
				"env": "alpha",
				"api": "1.0",
				"mycorp": "",
				"mysent": "",
				"mysize": "",
				"mysentsize": "",
				"dpp": req.body.dpp || 50, // documents per page
				"spp": "", // snippets per page
				"spd": req.body.spd || 2, // snippets per doctument
				"mydocsize": "",
				"mode": "main",
				"lang": "ru",
				"sort": "i_grtagging",
				"nodia": "1",
				"text": "lexgramm",
				"parent1": 0,
				"level1": 0,
				"lex1": req.body.token, // "кот",
				"gramm1": "",
				"sem1": "",
				"flags1": "",
				"sem-mod1": "sem",
				"sem-mod1": "sem2",
				"parent2": 0,
				"level2": 0,
				"min2": 1,
				"max2": 1,
				"lex2": "",
				"gramm2": "",
				"sem2": "",
				"flags2": "",
				"sem-mod2": "sem",
				"sem-mod2": "sem2",
				"format": "json"
			};
			try {
	    const response = await axios.get('https://processing.ruscorpora.ru/search.xml', { params: params });
	    // console.log(response);
			res.json(response.data);
		  } catch (error) {
		    console.error(error);
				res.json({ "error": error });
		  }
		} else {
				res.json({ "error": "empty query" });
		}
	});


	app.listen(port);
	// console.log(`Running at port ${port}`);
})()
