'use strict';

// import dotenv from 'dotenv';
// const configLoaded = dotenv.config();
import axios from 'axios';
import persistentCache from 'persistent-cache';
const cache = persistentCache();

const getResults = async(token, corpus, dpp, spd, page) => {
  const params = {
    "env": "alpha",
    "api": "1.0",
    "mycorp": "",
    "mysent": "",
    "mysize": "",
    "mysentsize": "",
    "dpp": dpp || 50, // documents per page
    "spp": "", // snippets per page
    "spd": spd || 2, // snippets per document
    "mydocsize": "",
    "mode": corpus || "main",
    "lang": "ru",
    "sort": "i_grtagging",
    "nodia": "1",
    "text": "lexgramm",
    "parent1": 0,
    "level1": 0,
    "lex1": token,
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
    "format": "json",
    "p": page || 0,
  };
  try {
    const response = await axios.get('https://processing.ruscorpora.ru/search.xml', { params: params });
    // console.log(response);
    return response.data;
  } catch (error) {
    console.error(error);
    return;
  }
};

export default {

  async getFromCache(condition, key) {
    if(condition) {
      return cache.getSync(key);
    } else {
      return { "error": "empty query" };
    }
  },

  async getSearch (key, token, corpus, dpp, spd, isFull) {
    let pageCurrent = 0;
    let pageLast  = 1;
    const returnResults  = { "corp_stat": {}, "found_stat": {}, "documents": [], };
    while(pageCurrent !== pageLast) {
        const results = await getResults(token, corpus, dpp, spd, pageCurrent);
        if(results) {
          pageCurrent = results["pager_info"]["current_page_num"];
          pageLast  = results["pager_info"]["last_page_num"];
          returnResults["corp_stat"] = results["corp_stat"];
          returnResults["found_stat"] = results["found_stat"];
          // returnResults.documents.push(...results.documents);
          // external API was changed !!!
          returnResults.documents.push(...results.document_groups.flat());
          console.log(`${pageCurrent} of ${pageLast} pages`);
          if(!isFull) { break; }
        }
    }
    cache.putSync(key, returnResults);
    return returnResults;
  },

  async getTextMeta (id, corpus) {
    const params = {
      "mode": corpus || "main",
      "text": "document-info",
      "docid": id,
      "format": "json",
    };
    try {
      const response = await axios.get('https://processing.ruscorpora.ru/explain.xml', { params: params });
      // console.log(response);
      cache.putSync(id, response.data);
      return response.data;
    } catch (error) {
      console.error(error);
      return { "error": error };
    }
  },

  async getTokenMeta (id) {
    const params = {
      "mode": "main",
      "text": "word-info",
      "source": id,
      "format": "json",
    };
    try {
      const response = await axios.get('https://processing.ruscorpora.ru/explain.xml', { params: params });
      // console.log(response);
      cache.putSync(id, response.data);
      return response.data;
    } catch (error) {
      console.error(error);
      return { "error": error };
    }
  },

  async getFreq(key, token, corpus) {
    const params = {
      "mode": corpus || "main",
      "lang": "ru",
      "sort": "i_grtagging",
      "sr": "1",
      "lex1": token,
      "g": "i_doc",
      "startyear": "1800",
      "dpp": "10",
      "spp": "10",
      "text": "lexgramm",
      "smoothing": "3",
      "level1": "0",
      "graphic_from_result": "1",
      "endyear": "2019",
      "parent1": "0",
      "nodia": "1",
      "sem-mod1": "sem",
      "spd": "10",
      "out": "normal",
      "format": "json",
    };

    try {
      const response = await axios.get('https://processing.ruscorpora.ru/graphic.xml', { params: params });
      // console.log(response.data.values[0].data);
      let {data} = response.data.values[0];
      if(data){
        data = data.map(x => [parseInt(x[0], 10), x[1]]).sort((a, b) => a[0] - b[0]);
      }
      const returnResults = { "freq": data };
      cache.putSync(key, returnResults);
      return returnResults;
    } catch (error) {
      console.error(error);
      return { "error": error };
    }
  },

  cache
};
