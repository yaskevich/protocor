import { reactive } from "vue";
import axios from "axios";
// import router from "./router";


interface MyData {
    user: Object;
    freqs: any,
    key: string,
};

interface ipmStruct {
  year: number,
  ipm: number,
};

interface ipmsStruct {
  [index: string]: ipmStruct
};

const state:MyData = reactive({
  key: localStorage.getItem('key') || '',
  user: {
        queries: JSON.parse(localStorage.getItem('queries') || "[]"),
  },
  freqs: {},
  search: {
    // token: localStorage.getItem('token') || '',
    token: '',
    spd: Number(localStorage.getItem('spd')) || 10,
    dpp: Number(localStorage.getItem('dpp')) || 10,
  },
  error: "",
});

const logout = async() => {
  localStorage.setItem("key", "");
  state.user  = {queries:[]};
}


const space000 = (x: String) =>  x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');


const getFormattedTime = () => {
    var today = new Date();
    var y = today.getFullYear();
    // JavaScript months are 0-based.
    var m = today.getMonth() + 1;
    var d = today.getDate();
    var h = today.getHours();
    var mi = today.getMinutes();
    var s = today.getSeconds();
    return y + "-" + m + "-" + d + "-" + h + "-" + mi + "-" + s;
}

const getUser = async() => {
    if(state.key) {
      try {
        const config = { headers: { Authorization: "Bearer " + state.key }, };
        const response = await axios.get("/api/user/info", config);
        state.user = response.data;
      } catch (error) {
        console.log("Cannot get user", error)
        return error;
      }
  }
};

const doLogin = async(payload: Object): Promise<any> => {
  // if (!state.key) {
    try {
     const response = await axios.post("/api/user/login", payload);
     if ("data" in response && "id" in response.data){
       state.user = response.data;
       state.key  = response.data.key || '';
       localStorage.setItem('key', state.key);
     } else {
       console.log(response);
       return response.data.error;
     }
     return;
   } catch (error) {
     console.log("Cannot log in", error)
     return error;
   }
 // }
 // console.log("No query: key exists.");
};

// const initUser = async(data: Object): Promise<any> => {
//   if (state.key) {
//     try {
//       const config = { headers: { Authorization: "Bearer " + state.key } };
//       const response = await axios.post('/api/user/add', data, config);
//       console.log(response.data);
//       return response;
//    } catch (error) {
//      console.log("Cannot get", error);
//      return error;
//    }
//  }
//  console.log("No key. Fail.");
// };

const postData = async(table: string, data: Object): Promise<any> => {
  if (state.key) {
    try {
      const config = { headers: { Authorization: "Bearer " + state.key } };
      console.log("send query", table);
      const response = await axios.post('/api/x/'+ table, data, config);
      console.log("store:response", response.data);
      return response;
   } catch (error) {
     console.log("Cannot get", error);
     return error;
   }
 }
 console.log("No key. Fail.");
};

// const deleteById = async(table: string, id: string): Promise<any> => {
//   if (state.key) {
//     try {
//     const config = { headers: { Authorization: "Bearer " + state.key }, "params": {} };
//      // if(id) { config["params"] = { id: id }; }
//      console.log("delete query", table, id);
//      const response = await axios.delete("/api/" + table + "/" + id, config);
//      console.log(response.data);
//      return response;
//    } catch (error) {
//      console.log("Cannot delete", error);
//      return error;
//    }
//  }
//  console.log("No key. Fail.");
// };

const getKeyValue = <T extends object, U extends keyof T>(key: U) => (obj: T) =>
  obj[key];

const getFreq =  async(token: string): Promise<any> => {
  if (token) {
    if (token in state.freqs){
      console.log("■ freq", token);
      return state.freqs[token as keyof typeof state.freqs];
    } else {
      try {
        // const config = {
          // headers: { Authorization: "Bearer " + state.token },
        // };
        const response:Object = await axios.post('/api/freq', { token: token }); // config);
        // resp.value = response.data;
        // console.log('freq', response.data);
        const data:Object  = response['data' as keyof typeof response];
        const result:Array<ipmsStruct> = data['freq'  as keyof typeof data] as any;

        const yearLast:number = Number(result.slice(-1)[0][0]);
        const yearFirst:number = Number(result[0][0]);
        const ipms:Array<number> = Array(yearLast - yearFirst).fill(0);
        let ipmMax:number = 0;
        result.forEach(item => {
          const ind:number = Number(item[0]) - yearFirst;
          const num  = Number(item[1]);
          ipms[ind] = num;
          if (ipmMax < num) {
            ipmMax = num;
          }
        });

        state.freqs[token] = {
          "yearLast": yearLast,
          "yearFirst": yearFirst,
          "ipmMax": ipmMax,
          "ipms": ipms,
        };
        return;
        // return {
          // "start": Number(response.data['freq'][0][0]),
          // "end": Number(response.data['freq'].slice(-1)[0][0]),
          // freq.data = response.data['freq'].map(Array.prototype.shift);
          // "data": response.data['freq'].map((x:any) => x[1]),
          // "data": response.data['freq'],
        // }
        // console.log('freq', freq);
      } catch (error) {
        console.log('Cannot get data via API', error);
        return error;
      }
    }
  }
};

const getData = async(route: string, id?: string): Promise<any> => {
  // if (state.key) {
    try {
    // const config = { headers: { Authorization: "Bearer " + state.key }, "params": {} };
     // if(id) { config["params"] = { id: id }; }
     const config = {};
     const response = await axios.get("/api/" + route, config);
     // console.log(response.data);
     return response.data;
   } catch (error) {
     console.log("Cannot get", error);
     return error;
   }
 // }
 // console.log("No key. Fail.");
};


export default {
  // state: readonly(state),
  getFreq,
  getData,
  logout,
  postData,
  getUser,
  doLogin,
  space000,
  getFormattedTime,
  // initUser,
  // getData,
  // deleteById,
  // doLogout,
  // getData
  state: state,
};
