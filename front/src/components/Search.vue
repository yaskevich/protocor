<template>
  hi
</template>
<script>
import { ref } from 'vue';
import { onBeforeMount } from 'vue';
// import store from "../store";
import { useRoute } from 'vue-router';
import axios from "axios";

export default {
  name: "User",
  props: {
    // datum: Object,
  },
  setup() {

    // const vuerouter = useRoute();
    // const id = vuerouter.params.id;
    const resp = ref({});

    onBeforeMount(async() => {


    });

    const onSubmit = async() => {
      try {
        const config =  {};  // { headers: { Authorization: "Bearer " + state.token }, };
        const response = await axios.get("/api/query", config);
        resp = response.data;
      } catch (error) {
        console.log("Cannot get data via API", error)
        return error;
      }
    };

    return { onSubmit, resp };
  },
  components: {

  }
};
</script>
