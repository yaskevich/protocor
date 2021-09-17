'use strict';

import fs from 'fs';
import path from 'path';
import csv from 'async-csv';

import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
const { Pool } = pg;
const pool = new Pool();

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const corpusMapping = {
  "accent_main": "accent",
  "accent_stihi": "stihi",
  "birchbark": "birchbank",
  "dialect": "dialect",
  "mid_rus": "midrus",
  "multi": "multiparc",              // ???
  "multiparc_eng-rus": "multiparc",  // ???
  "multiparc_rus": "multiparc",      // ???
  "murco": "murco",
  "old_rus": "oldrus",
  "orthlib": "orthlib",
  "paper": "paper",
  "para": "para",
  "poetic": "poetic",
  "school": "school",
  "source": "main",
  "spoken": "spoken",
  "standard": "main",
  // 'regional', syntax',
};

const idsArray = JSON.parse(fs.readFileSync('identifiers.json', 'utf8'));
const ids = Object.fromEntries(idsArray.map(x => [x.id, x]));

const featuresIds = {};

const featuresInsert = `INSERT INTO features (groupid, ru) VALUES($1, $2) ON CONFLICT (groupid, ru) DO update set (groupid, ru) = (EXCLUDED.groupid, EXCLUDED.ru) RETURNING id`;

async function updateFeatureId(field, content, num) {
  const uuid = field + content;
  if (!featuresIds?.[uuid]) {
    try {
      // console.log([field, content]);
      const result = await pool.query(featuresInsert, [field, content]);
      featuresIds[uuid] = result.rows[0].id;
    } catch (e) {
      console.error(num, e.detail);
    }
  }
  return featuresIds[uuid];
}

const columns = ['filepath', 'fileheader', 'created', 'editor_id', 'tagging'];

const schemes = [
  `DROP TABLE IF EXISTS texts`,
  `CREATE TABLE IF NOT EXISTS texts (id SERIAL PRIMARY KEY, filepath text, fileheader text, created text, corpus text, features integer[], editor_id text, tagging text)`,
  `DROP TABLE IF EXISTS features`,
  `CREATE TABLE IF NOT EXISTS features (
			id SERIAL PRIMARY KEY,
			groupid text,
			ru text not null,
			en text,
			UNIQUE (groupid, ru)
	)`,
  `CREATE UNIQUE INDEX group_ru_idx ON features (groupid, ru)`
];

const columns4query = ['corpus', ...columns, 'features'];
const textInsert = `INSERT INTO texts (${columns4query.join(", ")}) VALUES(${columns4query.map((x,i)=> '$'+ ++i).join(", ")}) RETURNING id`;

const getRuTitle = (x) => { return ids?.[x]?.['ru'] || x; }


async function processFile(filePath) {
  const corpusFile = path.basename(filePath, '.csv');
  const mark = ` ● ${corpusFile}`;
  console.time(mark);
  const corpus = corpusMapping[corpusFile];

  if(!corpus){
    console.log(`Wrong corpus file name "${corpusFile}". File will be ignored!`);
    return;
  }
  // console.log("corpus file → ID", corpusFile, corpus);
  // return;

  if (fs.existsSync(filePath)) {
    const csvString = fs.readFileSync(filePath, 'utf-8');
    let csvArr = [];

    try {
      csvArr = await csv.parse(csvString, {
        delimiter: ";",
        // quote: "'",
        // ltrim: true,
        // rtrim: true,
        relax: true,
        trim: true,
        skip_empty_lines: true,
        // columns: true,
       });
    } catch (e) {
      console.log(e.message);
      console.log("Parsing error! File will be ignored!");
      process.exit();
    }
    const fieldRow = csvArr.shift();
    // console.log(fieldRow);
    fieldRow[fieldRow.indexOf("path")] = "filepath";
    fieldRow[fieldRow.indexOf("header")] = "fileheader";

    let rowNumber = 0;

    try {
      await pool.query('BEGIN');
      for (let n = 0; n < csvArr.length; n++) {
        // rowNumber = `${n + 2}(${n})`;
        rowNumber = n + 2;
        const row = csvArr[n];
        const values = [];
        let skip = false;

        const props = [];
        const valuesDict = {};

        for (let i = 0; i < row.length; i++) {
          const data = row[i];
          const title = fieldRow[i];

          if (columns.includes(title)) {
            valuesDict[title] = data;
          } else if (data) {
            props.push(await updateFeatureId(title, data, rowNumber));
            // console.log(`${title} [${getRuTitle(title)}] ${data}`);
          }
        }

        // try {
        await pool.query(textInsert, [corpus].concat(columns.map(x => valuesDict[x])).concat([props]));
        // } catch (err) {
        //   console.log(err.stack);
        // }

      }
      await pool.query('COMMIT');
    } catch (e) {
      await pool.query('ROLLBACK');
      console.log(e.message);
    } // finally {
      // client.release();
    // }
  } else {
    console.log("Path to the file with data is incorrect!");
  }
  console.timeEnd(mark);
}

const initDatabase = async() => {
  for (let table in schemes) {
    // console.log(table);
    // await pool.query('DROP table IF EXISTS ' + table + ' CASCADE');
    await pool.query(schemes[table]);
  }
}

// entry point
(async () => {
  const args = process.argv.slice(2);

  if(args.length) {
    const initIndex = args.indexOf('-init');

    if(initIndex > -1) {
      console.log("...initializing database");
      await initDatabase();
      args.splice(initIndex, 1);
    }

    if(args.length) {
      const pathname = args.shift();
      const stat = fs.lstatSync(pathname);
      if(stat.isDirectory()) {
        console.log("...processing directory:", pathname);
        for (const file of fs.readdirSync(pathname)) {
          const csvPath = path.resolve(__dirname, pathname, file);
          if (fs.lstatSync(csvPath).isFile()){
              await processFile(csvPath);
          }
        }
      } else if (stat.isFile()) {
        const csvPath = path.resolve(__dirname, pathname);
        await processFile(csvPath);
      } else {
        console.log("Wrong path! Exiting...");
      }

    }
  } else {
    console.log("Put path to the file containing data as a command-line argument!");
  }
  await pool.end();
})();
