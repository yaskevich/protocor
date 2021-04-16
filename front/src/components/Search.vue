<template>
  <div class="p-field">
     <label for="spd" class="p-pr-2">Примеров на документ</label>
     <!-- decrementButtonClass="p-button-danger" incrementButtonClass="p-button-success"  -->
     <InputNumber inputClass="num-input" id="spd" v-model="params.spd" showButtons buttonLayout="horizontal" :step="1"
         incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" :min="rules.spd.min" :max="rules.spd.max"
         @input="onSubmit($event)" />
   </div>
  <div class="p-field">
     <label for="dpp" class="p-pr-2">Документов на страницу</label>
     <InputNumber inputClass="num-input" id="dpp" v-model="params.dpp" showButtons buttonLayout="horizontal" :step="1"
         incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" :min="rules.dpp.min" :max="rules.dpp.max"
         @input="onSubmit($event)"/>
   </div>
  <div class="p-d-flex p-jc-center p-mb-4">Запрос: <span class="p-text-bold p-pl-2">{{params.token}}</span></div>
  <div class="p-d-flex p-jc-center p-mb-4">
    <InputText type="text" v-model="params.token" @keyup.enter="onSubmit($event)"/>
    <Button label="Искать" @click="onSubmit($event)" :disabled="!params.token ? 'disabled': null"/>
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
import { ref, reactive } from 'vue';
// import { onBeforeMount } from 'vue';
// import store from "../store";
// import { useRoute } from 'vue-router';
import axios from "axios";
import store from "../store";

export default {
  name: "Search",
  // props: {
  //    datum: Object,
  // },
  setup() {

    // const vuerouter = useRoute();
    // const id = vuerouter.params.id;
    const resp = ref({});
    const params = store.state.search;
    console.log("init params", params);
    const rules = {
      dpp: { min: 1, max: 100 },
      spd: { min: 1, max: 100 },
    }

    // onBeforeMount(async() => {
    // });

    const onSubmit = async(e) => {
      // console.log(e);
      if (e?.originalEvent?.target?.id) {
        console.log("new val", e.originalEvent.target.id, e.value);
        if (e.value > rules[e.originalEvent.target.id]["max"]) {
            params[e.originalEvent.target.id] = rules[e.originalEvent.target.id]["max"];
        } else if (e.value < rules[e.originalEvent.target.id]["min"]) {
          params[e.originalEvent.target.id] = rules[e.originalEvent.target.id]["min"];
        } else {
          params[e.originalEvent.target.id] = e.value;
        }
      }
      localStorage.setItem('token', params.token);
      localStorage.setItem('spd', params.spd);
      localStorage.setItem('dpp', params.dpp);

      console.log("data", params);

      if(params.token){


        try {
          const config = {
             // headers: { Authorization: "Bearer " + state.token },
           };
          const response = await axios.post("/api/query", params,); // config);
          resp.value = response.data;
        } catch (error) {
          console.log("Cannot get data via API", error)
          return error;
        }
      }
    };

    return { onSubmit, resp, params, rules };
  },
  // components: {
  //
  // }
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
.snippet{
  border: 1px dashed gray;
}
.hit{
  color:darkred;
  font-weight:bold;
}
.doc{
  /* border: 1px dashed gray; */
}
.num-input{
  width: 3rem;
}
</style>
