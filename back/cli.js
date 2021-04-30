import fs from 'fs';
import axios  from 'axios';

const url = "https://processing.ruscorpora.ru/search.xml";
// "https://processing.ruscorpora.ru/search.xml?env=alpha&api=1.0&mycorp=&mysent=&mysize=&mysentsize=&dpp=&spp=&spd=&mydocsize=&mode=main&lang=ru&sort=i_grtagging&nodia=1&text=lexgramm&parent1=0&level1=0&lex1=%D0%BA%D0%BE%D1%82&gramm1=&sem1=&flags1=&sem-mod1=sem&sem-mod1=sem2&parent2=0&level2=0&min2=1&max2=1&lex2=&gramm2=&sem2=&flags2=&sem-mod2=sem&sem-mod2=sem2&format=json";


const params = {
	"env": "alpha",
	"api": "1.0",
	"mycorp": "",
	"mysent": "",
	"mysize": "",
	"mysentsize": "",
	"dpp": "",
	"spp": "",
	"spd": "",
	"mydocsize": "",
	"mode": "main",
	"lang": "ru",
	"sort": "i_grtagging",
	"nodia": "1",
	"text": "lexgramm",
	"parent1": 0,
	"level1": 0,
	// "lex1": "%D0%BA%D0%BE%D1%82",
	"lex1": "кот",
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
	"format": "json"
};
axios.get(url, { params: params })
  .then(function (response) {
    // console.log(response);
	// fs.writeFile('myjsonfile.json', response.data, 'utf8');
	fs.writeFile ("input.json", JSON.stringify(response.data), function(err) {
		if (err) throw err;
		console.log('complete');
		}
	);
  })
  .catch(function (error) {
    console.log(error);
  });
