'use strict';

import fs from 'fs';
import path from 'path';
import csv from 'async-csv';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
		let rowNumber = 0;

        // for (const row of csvArr) {
		for (let n = 0; n < csvArr.length; n++) {
			// rowNumber = `${n + 2}(${n})`;
			rowNumber = n+2;
			const row = csvArr[n];
            const values = [];
			let skip = false;
            
            for (let i=0; i < row.length; i++) {
                const data  = row[i];
                
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