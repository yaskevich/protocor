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
import persistentCache from 'persistent-cache';
// import db from './db.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
	const cache = persistentCache();
	const app = express();
	const port = process.env.PORT || 3061;
	const JWTStrategy   = passportJWT.Strategy;
	const ExtractJWT = passportJWT.ExtractJwt;
	console.log("cache keys:", cache.keysSync());

	const serializeQuery = (query) => Object.entries(query).map( x => x.join('') ).join('');

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

	const getResults = async(token, corpus, dpp, spd, page) => {
		const params = {
			"env": "alpha",
			"api": "1.0",
			"mycorp": "",
			"mysent": "",
			"mysize": "",
			"mysentsize": "",
			"dpp": dpp || 50, // documents per page
			"spp": "", // snippets per page
			"spd": spd || 2, // snippets per document
			"mydocsize": "",
			"mode": corpus || "main",
			"lang": "ru",
			"sort": "i_grtagging",
			"nodia": "1",
			"text": "lexgramm",
			"parent1": 0,
			"level1": 0,
			"lex1": token,
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
			"format": "json",
			"p": page || 0,
		};
		try {
			const response = await axios.get('https://processing.ruscorpora.ru/search.xml', { params: params });
			// console.log(response);
			return response.data;
		} catch (error) {
			console.error(error);
			return;
		}
	};

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

	app.post('/api/freq', async(req, res) => {
		console.log(req.method, req.url, req.body);
		const cacheKey = serializeQuery(req.body);
		const datum = cache.getSync(cacheKey);

		if (datum && Object.keys(datum)) {
			 console.log("cached", req.body.token);
			 res.json(datum);
		} else {
			if (req.body.token) {
				const params = {
					"mode": req.body.corpus || "main",
	        "lang": "ru",
	        "sort": "i_grtagging",
	        "sr": "1",
	        "lex1": req.body.token,
	        "g": "i_doc",
	        "startyear": "1800",
	        "dpp": "10",
	        "spp": "10",
	        "text": "lexgramm",
	        "smoothing": "3",
	        "level1": "0",
	        "graphic_from_result": "1",
	        "endyear": "2019",
	        "parent1": "0",
	        "nodia": "1",
	        "sem-mod1": "sem",
	        "spd": "10",
	        "out": "normal",
	        "format": "json",
	      };

				try {
		    	const response = await axios.get('https://processing.ruscorpora.ru/graphic.xml', { params: params });
		    	// console.log(response.data.values[0].data);
					const returnResults = response.data.values[0].data;
					cache.putSync(cacheKey, returnResults);
					res.json({ "freq": returnResults });
			  } catch (error) {
			    console.error(error);
					res.json({ "error": error });
			  }
			} else {
					res.json({ "error": "empty query" });
			}
		}
	});

	app.post('/api/text', async(req, res) => {
		console.log(req.method, req.url, req.body);
		if (req.body.id) {
			const datum = cache.getSync(req.body.id);
			if (datum && Object.keys(datum)) {
				 console.log("cached", req.body.id);
				 res.json(datum);
			 } else {
					const params = {
						"mode": req.body.corpus || "main",
						"text": "document-info",
						"docid": req.body.id,
						"format": "json",
					};

					try {
			    	const response = await axios.get('https://processing.ruscorpora.ru/search-explan.xml', { params: params });
			    	// console.log(response);
						cache.putSync(req.body.id, response.data);
						res.json(response.data);
				  } catch (error) {
				    console.error(error);
						res.json({ "error": error });
				  }
			}
		} else {
				res.json({ "error": "empty query" });
		}
	});

	app.post('/api/query', async(req, res) => {
		console.log(req.method, req.url, req.body);
		const cacheKey = serializeQuery(req.body);
		const datum = cache.getSync(cacheKey);

		if (datum && Object.keys(datum)) {
			 console.log("cached", req.body.token);
			 res.json(datum);
		} else {
			if (req.body.token) {
					let pageCurrent = 0;
					let pageLast  = 1;
					const returnResults  = { "corp_stat": {}, "found_stat": {}, "documents": [], };
					while(pageCurrent !== pageLast) {
							const results = await getResults(req.body.token, req.body.corpus, req.body.dpp, req.body.spd, pageCurrent);
							if(results) {
								pageCurrent = results["pager_info"]["current_page_num"];
								pageLast  = results["pager_info"]["last_page_num"];
								returnResults["corp_stat"] = results["corp_stat"];
								returnResults["found_stat"] = results["found_stat"];
								// returnResults.documents.push(...results.documents);
								// external API was changed !!!
								returnResults.documents.push(...results.document_groups.flat());
								console.log(`${pageCurrent} of ${pageLast} pages`);
								if(!req.body.full) { break; }
							}
					}
					cache.putSync(cacheKey, returnResults);
					res.json(returnResults);
			} else {
					res.json({ "error": "empty query" });
			}
		}
	});

	app.listen(port);
	// console.log(`Running at port ${port}`);
})()
