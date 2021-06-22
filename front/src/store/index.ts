import { reactive } from "vue";
import axios from "axios";
// import router from "./router";

const state = reactive({
  key: localStorage.getItem('key') || '',
  user: {
        queries: JSON.parse(localStorage.getItem('queries') || "[]"),
  },
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
