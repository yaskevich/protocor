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

const idsArray = JSON.parse(fs.readFileSync('identifiers.json', 'utf8'));
const ids = Object.fromEntries(idsArray.map(x => [x.id, x]));

const featuresIds = {};

const featuresInsert = `INSERT INTO features (groupid, ru) VALUES($1, $2) RETURNING id`;

async function updateFeatureId(field, content, num){
    const uuid = field+content;
	if (!featuresIds?.[uuid]){
		try {
            const result  = await pool.query(featuresInsert, [field, content]);
            featuresIds[uuid] = result.rows[0].id;
        } catch (e){
            console.error(num, e.detail);
        }
	}
    return featuresIds[uuid];
}


const columns = ['filepath', 'fileheader', 'created', 'editor_id', 'tagging'];

const schemes = [
	`DROP TABLE IF EXISTS texts`,
	`CREATE TABLE IF NOT EXISTS texts (id SERIAL PRIMARY KEY, filepath text, fileheader text, created text, corpus text, features integer[], editor_id integer, tagging text)`,
	`DROP TABLE IF EXISTS features`,
	`CREATE TABLE IF NOT EXISTS features (
			id SERIAL PRIMARY KEY,
			groupid text,
			ru text not null,
			en text,
			UNIQUE (groupid, ru)
	)`,
];

const columns4query = ['corpus', ...columns, 'features'];
const textInsert = `INSERT INTO texts (${columns4query.join(", ")}) VALUES(${columns4query.map((x,i)=> '$'+ ++i).join(", ")}) RETURNING id`;

const getRuTitle = (x) => { return ids?.[x]?.['ru'] || x; }
	

async function processFile(fileName) {

    if(fs.existsSync(fileName)){
        const csvString = fs.readFileSync(path.join(__dirname, fileName), 'utf-8');
        let csvArr  = [];

        try {
            csvArr = await csv.parse(csvString, {delimiter: ";"});
        }
        catch(e) {
            console.log(e.message);
        }
		
		const corpus = process.argv[2].split(/\W/).splice(-2, 1).shift();

        const fieldRow = csvArr.shift();
		// console.log(fieldRow);
		fieldRow[fieldRow.indexOf("path")] = "filepath";
		fieldRow[fieldRow.indexOf("header")] = "fileheader";

		let rowNumber = 0;

		for (let table in schemes){
			// console.log(table);
			// await pool.query('DROP table IF EXISTS ' + table + ' CASCADE');
			await pool.query(schemes[table]);
		}
		


        // for (const row of csvArr) {
		for (let n = 0; n < csvArr.length; n++) {
			// rowNumber = `${n + 2}(${n})`;
			rowNumber = n+2;
			const row = csvArr[n];
            const values = [];
			let skip = false;
            
			const props = [];
			const valuesDict = {};
			
            for (let i=0; i < row.length; i++) {
                const data  = row[i];
				const title  = fieldRow[i];
				
				if (columns.includes(title)) {
					valuesDict[title] = data;
				} else if(data) {
					props.push(await updateFeatureId(title, data, rowNumber));
					// console.log(`${title} [${getRuTitle(title)}] ${data}`);
				}
            }
			
			try {
			  await pool.query(textInsert, [corpus].concat(columns.map(x => valuesDict[x])).concat([props]));
			} catch (err) {
			  console.log(err.stack);
			}
			
			// console.log("props", props);
			
			// if(rowNumber > 1) {
				// process.exit();
			// }
				
        }
        
        await pool.end();
		console.log("...done");
        
    } else {
        console.log("Path to the file with data is incorrect!");
    }
	
}
// entry point
(async () => { 
    if (process.argv[2]) {
        await processFile(process.argv[2]); 
    } else {
        console.log("Put path to the file containing data as a command-line argument!");
    }
})();