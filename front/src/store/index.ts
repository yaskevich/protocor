import { reactive } from "vue";
import axios from "axios";
// import router from "./router";

const state = reactive({
  key: localStorage.getItem('key') || '',
  user: {},
  search: {
    token: localStorage.getItem('token') || '',
    spd: Number(localStorage.getItem('spd')) || 10,
    dpp: Number(localStorage.getItem('dpp')) || 10,
  },
  error: "",
});

const logout = async() => {
  localStorage.setItem("key", "");
  state.user  = {};
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

// const getData = async(table: string, id?: string): Promise<any> => {
//   if (state.key) {
//     try {
//     const config = { headers: { Authorization: "Bearer " + state.key }, "params": {} };
//      if(id) { config["params"] = { id: id }; }
//      console.log("send query", table);
//      const response = await axios.get("/api/" + table, config);
//      console.log(response.data);
//      return response;
//    } catch (error) {
//      console.log("Cannot get", error);
//      return error;
//    }
//  }
//  console.log("No key. Fail.");
// };


export default {
  // state: readonly(state),
  logout,
  postData,
  getUser,
  doLogin,
  // initUser,
  // getData,
  // deleteById,
  // doLogout,
  // getData
  state: state,
};