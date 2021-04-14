<template>
  <div class="p-d-flex p-jc-center p-mb-4">Запрос: <span class="p-text-bold p-pl-2">{{token}}</span></div>
  <div class="p-d-flex p-jc-center p-mb-4">
    <InputText type="text" v-model="token" />
    <Button label="Искать" @click="onSubmit($event)"/>
  </div>
  <div v-if="resp.hasOwnProperty('corp_stat')">
    <div class="">Корпус: {{resp.corp_stat.stats[1].num}} слов, {{resp.corp_stat.stats[0].num}} документов</div>
    <div>Найдено: {{resp.found_stat.stats[1].num}} вхождений, {{resp.found_stat.stats[0].num}} документов</div>

    <div v-for="(value, key) in resp.documents" class="p-mt-4 doc p-p-2 p-shadow-3">
      <div v-for="(snippet, index) in value.snippets" class="p-mt-2 snippet">
        <span v-for="(word, num) in snippet.words" :class="word.hit?'hit':''">
          {{word.text}}
        </span>
      </div>
      <span class="source-title p-pr-2">{{value.document_info.title}}</span>
      <span class="note">{{value.document_info.homonymy}}</span>
    </div>
  </div>
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
    const token = ref('');

    // onBeforeMount(async() => {
    // });

    const onSubmit = async() => {
      console.log("token", token);
      if(token.value){
        try {
          const config = {
             // headers: { Authorization: "Bearer " + state.token },
           };
          const response = await axios.post("/api/query", {token: token.value},); // config);
          resp.value = response.data;
        } catch (error) {
          console.log("Cannot get data via API", error)
          return error;
        }
      }
    };

    return { onSubmit, resp, token };
  },
  components: {

  }
};
</script>
<style>
.source-title{
  /* font-style: italic; */
  font-size: 0.75rem;
}
.note{
  color: red;
  font-size: 0.5rem;
}
.hit{
  color:darkred;
  font-weight:bold;
}
.doc{
  /* border: 1px dashed gray; */
}
</style>
