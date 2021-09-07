'use strict';

import fs from 'fs';
import path from 'path';
import csv from 'async-csv';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

		
		csvArr.shift();
		const fieldRow = csvArr.shift();
		console.log(fieldRow);
		


		let rowNumber = 0;

		// for (const row of csvArr) {
		for (let n = 0; n < csvArr.length; n++) {
		  // rowNumber = `${n + 2}(${n})`;
		  rowNumber = n + 2;
		  const row = csvArr[n];
		  
		  console.log(row[0].replace(/\n|\r\n/g, ''), row[1].replace(/\n|\r\n/g, ''));
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

		console.log("...done");
	} else {
		console.log("Path to the file with data is incorrect!");
	}
})();