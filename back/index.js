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
import fs from 'fs';

import swaggerJsDoc from 'swagger-jsdoc';
import swaggerExpress from 'swagger-ui-express';

import db from './db.js';

import search from './search.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __package = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const title = "Ruscorpora API";
const swaggerOptions = {
	swaggerDefinition: {
    info: {
      version: "2.0.0",
      title: title,
      description: title,
			"contact": {
		    "name": "Ruscorpora",
		    "url": "http://dev.ruscorpora.ru/api",
		    "email": "dev@ruscorpora.ru"
		  },
      servers: ["http://localhost:3061"]
    }
  },
  apis: ["index.js"]
};

const swaggerUIOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: title,
  // customfavIcon: "/assets/favicon.ico"
};

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

	const swaggerDocs = swaggerJsDoc(swaggerOptions);
	app.use("/api/docs", swaggerExpress.serve, swaggerExpress.setup(swaggerDocs, swaggerUIOptions));
	// app.use(compression());
	// app.set('trust proxy', 1);
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(express.static('public'));

	// Routes
	/**
	 * @swagger
	 * tags:
	 *   name: User
	 *   description: User login and user data management
	 */
	/**
	* @swagger
	* /api/reg:
	*  post:
	*    tags: [User]
	*    description: Create a new user
	*    responses:
	*      '200':
	*        description: A successful response
	*/
	app.post('/api/reg', async(req,res) => {
		const result = await db.createUser(req.body, false);
		res.json(result);
	});
	/**
   * @swagger
   * /api/login:
   *   post:
   *     description: Login to the application
   *     tags: [User]
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: email
   *         description: User's e-mail
   *         in: formData
   *         required: true
   *         type: string
   *       - name: password
   *         description: User's password.
   *         in: formData
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: user info
   */
	app.post('/api/login', async(req, res) => {
		console.log("login data", req.body);
		const userData = await db.getUserData(req.body["email"], req.body["password"]);
		if (userData && Object.keys(userData).length && !userData.hasOwnProperty("error") ) {
			console.log(req.body["email"], "<SUCCESS>");
			const token = createToken(userData);
			userData["token"] = token;
			res.json(userData);
		} else {
			console.log(`login attempt as [${req.body["email"]}]•[${req.body["password"]}]►${userData.error}◄`);
			res.json(userData);
		}
	});

	app.get('/api/logout', (req, res) => {
		console.log("logging out");
		// You can add "issue time" to token and maintain "last logout time" for each user on the server.
		// When you check token validity, also check "issue time" be after "last logout time".
		// res.redirect('/login');
	});

	app.get('/api/profile', auth, async(req,res) => {
		res.json(req.user);
	 });
	/**
 	* @swagger
 	* /api/config:
 	*  get:
 	*    description: Return server application configuration info as JSON
  *    tags: [Middleware]
 	*    responses:
 	*      '200':
 	*        description: results in JSON format
 	*/
	app.get('/api/config', (req, res) => {
		// later localization could be added
		res.json({
			 "server": __package.version,
			 "specs": swaggerOptions.swaggerDefinition.info.version,
		 });
	});

	app.get('/api/test', (req, res) => {
		res.json({ "message": "ok" });
	});
	/**
  * @swagger
  * /api/grammar:
  *  get:
  *    tags: [Middleware]
  *    description: Return information on grammar features and categories as hierarchy in JSON
  *    responses:
  *      '200':
  *        description: results in JSON format
  */
	app.get('/api/grammar', (req, res) => {
		// remember: remove X in gender (it was added to avoid duplicates in JSON)
		res.sendFile(path.join(__dirname, "grammar.json"));
	});

	app.get('/api/userlogs/:route*?', auth, async(req, res) => {
		const routes = ["query", "trend"];
		const route = routes.includes(req.params.route) ? req.params.route : "";
		res.json(await db.getUserlogs(req.user.id, route));
	});
/**
 * @swagger
 * /api/text:
 *   post:
 *     description: Returns text info by text ID and corpus. It was discussed with search engine developers that in the future corpus name won't be required. Anyway, if omitted, “main” is used as a default one.
 *     tags: [Search]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: text ID
 *         in: formData
 *         required: true
 *         type: string
 *         example: bWFpbi9zdGFuZGFyZC9wb3N0MTk1MC9uYXVrYS9zdGF0aXN0aWNhLzUxODI5MC54bWw=
 *       - name: corpus
 *         description: corpus name
 *         in: formData
 *         type: string
 *         example: main
 *     responses:
 *       200:
 *         description: results in JSON format
 */
	app.post('/api/text', async(req, res) => {
		const cacheKey = req.body.id;
		const datum = await search.getFromCache(req.body.id, cacheKey);
		console.log(datum ? '■': '□', req.method, req.url, req.body);
		res.json(datum || await search.getTextMeta (req.body.id, req.body.corpus || 'main'));
	});
 /**
  * @swagger
  * /api/token:
  *   post:
	*     description: Returns token info by token ID
  *     tags: [Search]
  *     produces:
  *       - application/json
  *     parameters:
  *       - name: id
  *         description: token ID
  *         in: formData
  *         required: true
  *         type: string
  *         example: bWFpbi9zdGFuZGFyZC9wb3N0MTk1MC9mb3J1bS9lbGVjdHJvY29tL3NsdXpoZWJueWpfcm9tYW5fZGlzYW1iLnhtbAkzNDQJNA==
  *     responses:
  *       200:
  *         description: results in JSON format
  */
	app.post('/api/token', async(req, res) => {
		const cacheKey = req.body.id;
		console.log("get token", cacheKey);
		const datum = await search.getFromCache(cacheKey, cacheKey);
		console.log(datum ? '■': '□', req.method, req.url, req.body);
		res.json(datum || await search.getTokenMeta (cacheKey));
	});
/**
 * @swagger
 * /api/freq:
 *   post:
 *     description: Returns token frequency historical data. If corpus name is omitted, “main” used as a default one.
 *     tags: [Search]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         description: token
 *         in: formData
 *         required: true
 *         type: string
 *         example: кот
 *       - name: corpus
 *         description: corpus name
 *         in: formData
 *         type: string
 *         example: main
 *     responses:
 *       200:
 *         description: results in JSON format
 */
	app.post('/api/freq', async(req, res) => {
		const cacheKey = serializeQuery(req.url, { [req.body.token]: req.body.corpus || 'main' });
		const datum = await search.getFromCache(req.body.token, cacheKey);
		console.log(datum ? '■': '□', req.method, req.url, req.body);
		res.json(datum || await search.getFreq(cacheKey, req.body.token, req.body.corpus));
	});
	/**
	 * @swagger
	 * /api/query:
	 *    post:
	 *      description: Search in corpus
	 *    parameters:
	 *      - name: corpus
	 *        in: query
	 *        description: Subcorpus ID where to search
	 *        required: false
	 *        schema:
	 *          type: string
	 *          format: string
	 *      - name: token
	 *        in: query
	 *        description: token to search
	 *        required: true
	 *        schema:
	 *          type: string
	 *          format: string
	 *      - name: dpp
	 *        in: query
	 *        description: number of documents to return
	 *        required: false
	 *        schema:
	 *          type: integer
	 *          format: int32
	 *      - name: spd
	 *        in: query
	 *        description: number of snippets per document
	 *        required: false
	 *        schema:
	 *          type: integer
	 *          format: int32
	 *    responses:
	 *      '200':
	 *        description: search results in JSON format
	 */
	app.post('/api/query', async(req, res) => {
		const cacheKey = serializeQuery(req.url, req.body);
		const datum = await search.getFromCache(req.body.token, cacheKey);
		console.log(datum ? '■': '□', req.method, req.url, req.body);
		res.json(datum || await search.getSearch(cacheKey, req.body.token, req.body.corpus, req.body.dpp, req.body.spd, req.body.full));
	});

	app.post('/api/auth/query', auth, async(req, res) => {
		const cacheKey = serializeQuery(req.url, req.body);
		// console.log("search", req.user.id, req.body);
		const result = db.saveQuery(req.user.id, 'query', req.body.corpus|| 'main', req.body);
		console.log("query saved");
		const datum = await search.getFromCache(req.body.token, cacheKey);
		console.log(datum ? '■': '□', req.method, req.url, req.body);
		res.json(datum || await search.getSearch(cacheKey, req.body.token, req.body.corpus, req.body.dpp, req.body.spd, req.body.full));
	});

	app.post('/api/auth/log', auth, async(req, res) => {
		const result = db.saveQuery(req.user.id, 'trend', req.body.corpus|| 'main', req.body);
		res.json({"result": "ok"});
	});

	app.all('/api/features/:corpus*?', async(req, res) => {
		const corpus = req.params.corpus || "main";
		console.log("corpus", corpus);
		const props = await db.getFeaturesUnique(corpus);
		const dict  = await db.getFeaturesDict(corpus);
		const count = await db.getCorpusCount(corpus);
		const meta = await db.getMetafields('ru');
		const corpora = [
			{ name: 'основной', id: 'main' },
			{ name: 'газетный', id: 'paper' },
			{ name: 'параллельный', id: 'para' },
			{ name: 'обучающий', id: 'school' },
			{ name: 'диалектный', id: 'dialect' },
			{ name: 'поэтический', id: 'poetic' },
			{ name: 'устный', id: 'spoken' },
			{ name: 'акцентологический', id: 'accent' },
			{ name: 'мультимедийный', id: 'murco' },
			{ name: 'мультипарк', id: 'multiparc' },
			{ name: 'древнерусский', id: 'oldrus' },
			{ name: 'старорусский', id: 'midrus' },
			{ name: 'церковнославянский', id: 'orthlib' },
			{ name: 'берестяные грамоты', id: 'birchbank' },
			{ name: 'газетный региональный', id: 'regional' },
			{ name: 'акцентологический (стихи)', id: 'stihi' },

			{ name: 'синтаксический', id: 'syntax' },
		];
		res.json({ corpora, count, dict, props, meta });
	});

	app.listen(port);
	// console.log(`Running at port ${port}`);
})()
