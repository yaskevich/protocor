'use strict';

import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import express from 'express';
import compression from 'compression';
import history from 'connect-history-api-fallback';
import bodyParser from 'body-parser';
import passport from 'passport';
import passportJWT from "passport-jwt";
import jwt from 'jsonwebtoken';
import fs from 'fs';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerExpress from 'swagger-ui-express';
import Bowser from "bowser";

import db from './db.js';
import search from './search.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __package = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const indexHTML = path.join(__dirname, 'public', 'index.html');
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
			servers: ["http://localhost:3061"],
    }
  },
  apis: ["index.js"]
};

const swaggerUIOptions = {
	customCss: '.swagger-ui .topbar { display: none } .scheme-container { display: none }',
	customSiteTitle: title,
	// customfavIcon: "/assets/favicon.ico"
	swaggerOptions: {
 		tryItOutEnabled: true
	}
};

(async () => {

	const app = express();
	const port = process.env.PORT || 3061;
	// console.log("cache keys:", search.cache.keysSync());
	const dt = new Intl.DateTimeFormat('ru-RU', { year: 'numeric', month: 'numeric', day: 'numeric', hour12: false, hour: "numeric", minute: "numeric", second: "numeric"});

	const serializeQuery = (method, query) => method.replace(/\//g, '') + Object.entries(query).map( x => x.join('') ).join('');

	const createToken = (user) => {
	  return jwt.sign({
	    iss: 'yaskevich',
	    sub: user.id,
	    iat: new Date().getTime(),
	    exp: new Date().setDate(new Date().getDate() + 1)
	  }, process.env.JWT_SECRET);
	};

	const strategy  = new passportJWT.Strategy({
		  jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
		  secretOrKey   : process.env.JWT_SECRET
		}, function (jwtPayload, done) {
		  return db.getUserDataByID(jwtPayload.sub)
		    .then(user => { return done(null, user); })
			  .catch(err => { return done(err); });
		});

	passport.use(strategy);
	app.use(passport.initialize());
	const auth = passport.authenticate('jwt', {session: false});
	app.use("/api/docs", swaggerExpress.serve, swaggerExpress.setup(swaggerJsDoc(swaggerOptions), swaggerUIOptions));
	app.use(compression());
	app.set('trust proxy', 1);
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(express.static('public'));

	if(process.env.NODE_ENV === "production") {
		app.use(history({
				// verbose: true,
				index: "/",
			}));
	}

	app.use( async(req, res, next) => {
		if (req.url === "/api/config"){
			const ua = Bowser.parse(req.get('user-agent'));
			console.log(`${dt.format(Date.now()).replace(',', '')} · ${req.ip} · ${ua.browser.name} ${ua.browser.version.split('.').shift()} · ${ua.os.name} ${ua.os.versionName}`);
		}
		next();
	});
	// Routes

	/**
	 * @swagger
	 * tags:
	 *   name: Metadata
	 *   description: Retrieval of info related to server environment and metadata of corpora
	 */

	/**
	 * @swagger
	 * tags:
	 *   name: User
	 *   description: User login and user data management
	 */

	/**
	 * @swagger
	 * tags:
	 *   name: Search
	 *   description: Accessing corpus search engine
	 */

 // serve root page when subpage is opened directly in browser
 // Vue URL → root → Vue index.html
 app.get('/', (req, res) => { res.sendFile(indexHTML); });

 /**
 * @swagger
 * /api/reg:
 *   post:
 *     description: Create a new user
 *     tags: [User]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: email
 *         description: E-mail of a new user
 *         in: formData
 *         required: true
 *         type: string
 *         example: russian@yandex.ru
 *       - name: password
 *         description: Password for the user
 *         in: formData
 *         type: string
 *         example: verystrongpassword123456
 *       - name: firstname
 *         description: User's first name
 *         in: formData
 *         type: string
 *         example: Екатерина
 *       - name: lastname
 *         description: User's last name
 *         in: formData
 *         type: string
 *         example: Рахилина
 *       - name: sex
 *         description: User's grammatical gender (1 - female, 2 - male)
 *         in: formData
 *         type: integer
 *         minimum: 1
 *         maximum: 2
 *         example: 1
 *     responses:
 *       200:
 *         description: results in JSON format (key is 'message', value is user password)
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
	/**
  * @swagger
  * /api/profile:
  *  get:
  *    tags: [User]
  *    description: Return user profile of logged-in user
	*    parameters:
  *      - in: header
  *        name: Authorization
  *        default: Bearer
  *        schema:
  *          type: string
  *    responses:
  *      '200':
  *        description: results in JSON format
  */
	app.get('/api/profile', auth, async(req,res) => {
		res.json(req.user);
	 });
	/**
 	* @swagger
 	* /api/config:
 	*  get:
 	*    description: Return server application configuration info as JSON
  *    tags: [Metadata]
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
	/**
  * @swagger
  * /api/test:
  *  get:
  *    tags: [Metadata]
  *    description: Just return OK to be sure that API is working
  *    responses:
  *      '200':
  *        description: results in JSON format
  */
	app.get('/api/test', (req, res) => {
		res.json({ "message": "ok" });
	});
	/**
  * @swagger
  * /api/grammar:
  *  get:
  *    tags: [Metadata]
  *    description: Return information on grammar features and categories as hierarchy in JSON
  *    responses:
  *      '200':
  *        description: results in JSON format
  */
	app.get('/api/grammar', (req, res) => {
		// remember: remove X in gender (it was added to avoid duplicates in JSON)
		res.sendFile(path.join(__dirname, "grammar.json"));
	});
	/**
  * @swagger
  * /api/userlogs:
  *  get:
  *    tags: [User]
  *    description: Return history of user actions on specific UI
	*    parameters:
	*      - in: header
	*        name: Authorization
	*        default: Bearer
	*        schema:
	*          type: string
  *      - in: query
  *        name: id
  *        description: UI part
  *        default: query
  *        example: trend
  *        schema:
  *          type: string
  *    responses:
  *      '200':
  *        description: results in JSON format
  */
	app.get('/api/userlogs', auth, async(req, res) => {
		const routes = ["query", "trend"];
		const route = routes.includes(req.query.id) ? req.query.id : "";
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
  *   post:
  *     description: Return token search results
  *     tags: [Search]
  *     produces:
  *       - application/json
  *     parameters:
  *       - name: token
  *         description: token
  *         in: formData
  *         required: true
  *         example: заяц
  *         type: string
  *       - name: corpus
  *         description: corpus name
  *         in: formData
  *         type: string
  *         example: spoken
  *         default: main
	*       - name: dpp
  *         in: formData
	*         description: number of documents to return
	*         type: integer
  *         example: 20
  *         default: 1
	*       - name: spd
  *         in: formData
	*         description: number of snippets per document
	*         type: integer
  *         example: 3
  *         default: 1
  *     responses:
  *       200:
  *         description: results in JSON format
  */
	app.post('/api/query', async(req, res) => {
		const params = {
			"token": req.body.token,
			"corpus": req.body.corpus || "main",
			"dpp": req.body.dpp || 50,
			"spd": req.body.spd || 1,
			"full": req.body.full || '',
		};
		const route = req.url.substring(req.url.lastIndexOf('/') + 1);
		const cacheKey = serializeQuery(route, params);
		const datum = await search.getFromCache(params.token, cacheKey);
		console.log(datum ? '■': '□', req.method, req.url, params);
		res.json(datum || await search.getSearch(cacheKey, params.token, params.corpus, params.dpp, params.spd, params.full));
	});

	app.post('/api/auth/query', auth, async(req, res) => {
		const params = {
			"token": req.body.token,
			"corpus": req.body.corpus || "main",
			"dpp": req.body.dpp || 50,
			"spd": req.body.spd || 1,
			"full": req.body.full || '',
		};
		const route = req.url.substring(req.url.lastIndexOf('/') + 1);
		const cacheKey = serializeQuery(route, params);
		// console.log("search", req.user.id, req.body);
		const result = db.saveQuery(req.user.id, 'query', params.corpus, params);
		console.log("query saved");
		const datum = await search.getFromCache(params.token, cacheKey);
		console.log(datum ? '■': '□', req.method, req.url, params);
		res.json(datum || await search.getSearch(cacheKey, params.token, params.corpus, params.dpp, params.spd, params.full));
	});
// temporary solution (because of current client architecture)
// logging should be implemented just in a query, not separately!
	app.post('/api/auth/log', auth, async(req, res) => {
		const result = db.saveQuery(req.user.id, 'trend', req.body.corpus|| 'main', req.body);
		res.json({"result": "ok"});
	});
	/**
  * @swagger
  * /api/features:
  *  get:
  *    tags: [Metadata]
  *    description: Return info about the metadata features in specfic corpus
	*    parameters:
  *      - in: query
  *        name: id
  *        description: name of the corpus
  *        default: dialect
  *        example: spoken
  *        schema:
  *          type: string
  *    responses:
  *      '200':
  *        description: results in JSON format
  */
	app.get('/api/features', async(req, res) => {
		const corpus = req.query.id || "main";
		// console.log("corpus", corpus);
		const props = await db.getFeaturesUnique(corpus);
		const dict  = await db.getFeaturesDict(corpus);
		const count = await db.getCorpusCount(corpus);
		const meta = await db.getMetafields('ru');
		const corpora = [
			{ name: 'основной', id: 'main', freq: true },
			{ name: 'газетный', id: 'paper', freq: true },
			{ name: 'параллельный', id: 'para' },
			{ name: 'обучающий', id: 'school' },
			{ name: 'диалектный', id: 'dialect' },
			{ name: 'поэтический', id: 'poetic', freq: true },
			{ name: 'устный', id: 'spoken' },
			{ name: 'акцентологический', id: 'accent', freq: true },
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
