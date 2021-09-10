	'use strict';

import fs from 'fs';
import path from 'path';
import csv from 'async-csv';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
const { Pool } = pg;
const pool = new Pool();

const __dirname = dirname(fileURLToPath(import.meta.url));

(async () => {
	const fileName = "metadata.csv";
	if (fs.existsSync(fileName)) {
		const csvString = fs.readFileSync(path.join(__dirname, fileName), 'utf-8');
		let csvArr = [];

		try {
		  csvArr = await csv.parse(csvString, {
			delimiter: ",",
			// quote: "'",
			// ltrim: true,
			// rtrim: true,
			// relax: true,
			trim: true,
			skip_empty_lines: true,
			// columns: true,
		   });
		} catch (e) {
		  console.log(e.message);
		  console.log("...exiting because of error");
		  process.exit();
		}

		const tableScheme = `CREATE TABLE IF NOT EXISTS metafields (
				id SERIAL PRIMARY KEY,
				name text,
				ru text not null,
				en text
		)`;

		await pool.query('DROP table IF EXISTS metafields');
		await pool.query(tableScheme);


		csvArr.shift();
		const fieldRow = csvArr.shift();
		console.log(fieldRow);

		const colsToRu = {};

		let rowNumber = 0;

		// for (const row of csvArr) {
		for (let n = 0; n < csvArr.length; n++) {
		  // rowNumber = `${n + 2}(${n})`;
		  rowNumber = n + 2;
		  const row = csvArr[n];

			const [key, val] = row.map (x => x.replace(/\n|\r\n/g, ''));
			colsToRu[key] = val;

			await pool.query(`INSERT INTO metafields (name, ru) VALUES($1, $2) RETURNING id`, [key, val]);

		  // const values = [];
		  // let skip = false;

		  // const props = [];
		  // const valuesDict = {};

		  // for (let i = 0; i < row.length; i++) {
			// const data = row[i];
			// const title = fieldRow[i];

			// if (columns.includes(title)) {
			  // valuesDict[title] = data;
			// } else if (data) {
			  // props.push(await updateFeatureId(title, data, rowNumber));
			  // // console.log(`${title} [${getRuTitle(title)}] ${data}`);
			// }
		  // }

		}

		await pool.end();
		console.log("...done");
	} else {
		console.log("Path to the file with data is incorrect!");
	}
})();
