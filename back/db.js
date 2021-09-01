'use strict';

import dotenv from 'dotenv';
const configLoaded = dotenv.config();

import bcrypt from 'bcrypt';
const saltRounds = 8;

import passGen from 'generate-password';
const passOptions = { length: 18, numbers: true, uppercase: false, excludeSimilarCharacters: true, strict: true, symbols: false };

import pg from 'pg';
const { Pool } = pg;
const pool = new Pool();

const databaseQuery = `SELECT	table_name, column_name, ordinal_position,
	column_default, is_nullable, data_type
	FROM information_schema.columns
	WHERE table_schema = 'public'
	ORDER BY table_name, ordinal_position`;

const tablesQueries = [
  `CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		firstname text not null,
		lastname text not null,
		email text not null,
		sex integer not null,
		_passhash text not null,
		activated BOOLEAN NOT NULL DEFAULT FALSE
	)`,
  `ALTER TABLE users OWNER TO ${process.env.PGUSER}`,
  `CREATE TABLE IF NOT EXISTS userlogs (
		id SERIAL PRIMARY KEY,
		user_id integer,
    route text,
		corpus text not null,
		query json
	)`,
  `ALTER TABLE userlogs OWNER TO ${process.env.PGUSER}`,
];

let tablesResult = await pool.query(databaseQuery);

if (!tablesResult.rows.length) {
  console.log("initializing database: started");
  try {
    await pool.query('BEGIN')
    try {
      for (let i = 0; i < tablesQueries.length; i++) {
        await pool.query(tablesQueries[i]);
      }
      await pool.query('COMMIT');
      tablesResult = await pool.query(databaseQuery);
      console.log("initializing database: done");
    } catch (error) {
      await pool.query('ROLLBACK');
    }
  } catch (error) {
    console.log("initializing database: error\n", error);
  }
}

export default {
  async getUserDataByID(id) {
    const res = await pool.query("SELECT id, firstname, lastname, email, sex from users WHERE id = $1 AND activated = TRUE", [id]);
    return res.rows[0];
  },
  async getUserData(email, pwd) {
    if (!email) { return { "error": "email" }; } else if (!pwd) { return { "error": "password" }; }

    // console.log("email/pwd", email, pwd);
    const res = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (res.rows.length) {
      const data = res.rows[0];
      // console.log("userdata", data);
      // console.log("pass/hash", pwd, data._passhash);
      if (data.activated) {
        const result = await bcrypt.compare(pwd, data._passhash);
        delete data._passhash;
        // console.log("pass/hash result", result);
        return result ? data : { "error": "password" };
      } else {
        return { "error": "user status" };
      }
    } else {
      return { "error": "email" };
    }

    return { "error": "unknown" };
  },
  async createUser(data, isActivated = false) {
    console.log("create user", data);
    const usersData = await pool.query(`SELECT * FROM users`);
    if (usersData.rows.length) {
      if (usersData.rows.filter(x => x.email == data.email).length) {
        return { "error": "email not unique" };
      }
    }
    const pwd = passGen.generate(passOptions);
    console.log("make hash");
    const hash = await bcrypt.hash(pwd, saltRounds);
    console.log("ready");
    // console.log(pwd, hash);
    const result = await pool.query(`INSERT INTO users (firstname, lastname, email, sex, _passhash, activated) VALUES($1, $2, $3, $4, $5, $6) RETURNING id`, [data.firstname, data.lastname, data.email, data.sex, hash, isActivated]);
    if (result.rows.length === 1) {
      return { "message": pwd };
    }
    return { "error": "user" };
  },
  async saveQuery(user_id, route, corpus, query) {
    const result = await pool.query(`INSERT INTO userlogs (user_id, route, corpus, query) VALUES($1, $2, $3, $4) RETURNING id`, [user_id, route, corpus, query]);
    return result;
  },
	async getUserlogs(id, route) {
    let query  = "SELECT corpus, query from userlogs WHERE user_id = $1";
    const values  = [id];
    if (route) {
      values.push(route);
      query += " AND route =  $2";
    }
		const res = await pool.query(query, values);
		return res.rows;
	},
	async getFeaturesUnique() {
    const query  = "SELECT prop, count(prop)::int FROM texts, unnest(features) AS prop group by prop";
		const res = await pool.query(query);
		return res?.rows;
	},
	async getFeaturesDict() {
    // const query  = "select array_agg(distinct u.val) uniquefeatures from texts t cross join lateral unnest(t.features) as u(val)";
    // , 'topic'
    const query  = "select id, groupid, ru from features where groupid in ('audience_age', 'audience_level', 'audience_size', 'created', 'medium') AND id in (select unnest(array_agg(distinct u.val)) uniquefeatures from texts t cross join lateral unnest(t.features) as u(val))";
		const res = await pool.query(query);
    // return res?.rows[0]?.uniquefeatures;
		return res?.rows;
	},
  async getCorpusCount(corpus) {
    const query  = "SELECT count(*)::int FROM texts where corpus = $1";
    const res = await pool.query(query, [corpus]);
    return res?.rows?.[0]?.count;
  },
};
