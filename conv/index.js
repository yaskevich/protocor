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

const featuresId = [];

const columns = ['path', 'header', 'created', 'editor_id'];

const schemes = [
	`DROP TABLE IF EXISTS texts`,
	`CREATE TABLE IF NOT EXISTS texts (id SERIAL PRIMARY KEY, filepath text, header text, created text, features json, editor_id integer)`,
	`DROP TABLE IF EXISTS features`,
	`CREATE TABLE IF NOT EXISTS features (
			id SERIAL PRIMARY KEY,
			groupid text,
			ru text not null,
			en text,
			UNIQUE (groupid, ru)
	)`,
];


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

        const fieldRow = csvArr.shift();
		// console.log(fieldRow);

		let rowNumber = 0;

		for (let table in schemes){
			// console.log(table);
			// await pool.query('DROP table IF EXISTS ' + table + ' CASCADE');
			await pool.query(schemes[table]);
		}
		await pool.end();


        // for (const row of csvArr) {
		for (let n = 0; n < csvArr.length; n++) {
			// rowNumber = `${n + 2}(${n})`;
			rowNumber = n+2;
			const row = csvArr[n];
            const values = [];
			let skip = false;
            
            for (let i=0; i < row.length; i++) {
                const data  = row[i];
                // getRuTitle
				if(data) {
					console.log(`${fieldRow[i]} [${getRuTitle(fieldRow[i])}] ${data}`);
				}
            }
			
			
			if(rowNumber > 1) {
				return;
			}
				
    
        }
        
        // await pool.end();

        
        
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