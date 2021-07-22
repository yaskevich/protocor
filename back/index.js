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
import db from './db.js';

import search from './search.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {

	const app = express();
	const port = process.env.PORT || 3061;
	const JWTStrategy   = passportJWT.Strategy;
	const ExtractJWT = passportJWT.ExtractJwt;
	// console.log("cache keys:", search.cache.keysSync());

	const serializeQuery = (method, query) => method.replace(/\//g, '') + Object.entries(query).map( x => x.join('') ).join('');

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

	app.post('/api/reg', async(req,res) => {
		const result = await db.createUser(req.body, false);
		res.json(result);
	});

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

	app.get('/api/grammar', (req, res) => {
		// remember: remove X in gender (it was added to avoid duplicates in JSON)
		res.sendFile(path.join(__dirname, "grammar.json"));
	});

	app.post('/api/text', async(req, res) => {
		const cacheKey = req.body.id;
		const datum = await search.getFromCache(req.body.id, cacheKey);
		console.log(datum ? '■': '□', req.method, req.url, req.body);
		res.json(datum || await search.getTextMeta (req.body.id, req.body.corpus));
	});

	app.post('/api/freq', async(req, res) => {
		const cacheKey = serializeQuery(req.url, { [req.body.token]: req.body.corpus || 'main'  });
		const datum = await search.getFromCache(req.body.token, cacheKey);
		console.log(datum ? '■': '□', req.method, req.url, req.body);
		res.json(datum || await search.getFreq(cacheKey, req.body.token, req.body.corpus));
	});

	app.post('/api/query', async(req, res) => {
		const cacheKey = serializeQuery(req.url, req.body);
		const datum = await search.getFromCache(req.body.token, cacheKey);
		console.log(datum ? '■': '□', req.method, req.url, req.body);
		res.json(datum || await search.getSearch(cacheKey, req.body.token, req.body.corpus, req.body.dpp, req.body.spd, req.body.full));
	});

	app.listen(port);
	// console.log(`Running at port ${port}`);
})()
