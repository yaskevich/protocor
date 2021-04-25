<template>
  <div class="p-field">
    <span v-for="item in tokens">
      <!-- v-if="item !== params.token" -->
      <Button :label="item" class="p-button-sm p-button-plain p-button-text p-button-raised" @click="params.token = item; onSubmit($event);"/>
    </span>
  </div>

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
    <!-- <Button label="Искать" @click="onSubmit($event)" :disabled="!params.token ? 'disabled': null"/> -->
    <SplitButton label="Искать" @click="onSubmit" :model="buttonItems" :disabled="!params.token ? 'disabled': null"></SplitButton>
    <Button icon="pi pi-chart-line" @click="renderChart" class="p-button-success p-ml-2" :disabled="!params.token ? 'disabled': null"/>
  </div>

  <div class="chart-holder">
    <Chart :data="freq.data" :start="freq.start" :end="freq.end" />
  </div>

  <div v-if="resp.hasOwnProperty('corp_stat')" class="p-mt-4">
    <div class="">Корпус: {{resp.corp_stat.stats[1].num}} слов, {{resp.corp_stat.stats[0].num}} документов</div>
    <div>Найдено: {{resp.found_stat.stats[1].num}} вхождений, {{resp.found_stat.stats[0].num}} документов</div>
    <Divider />
    <div v-for="(value, key) in resp.documents" class="p-mt-1 doc p-p-2 p-shadow-3">
      <div v-for="(snippet, index) in value.snippets" class="p-mt-2 snippet">
        <span v-for="(word, num) in snippet.words" :class="word.hit?'hit':''">
          {{word.text}}
        </span>
      </div>
      <span class="source-title p-pr-2">{{value.document_info.title}}
        <Button icon="pi pi-search" class="p-button-rounded p-button-primary p-button-text mini-button"  @click="openModal(value.document_info.id)" /> </span>
      <span class="note">{{value.document_info.homonymy}}</span>
    </div>
  </div>

  <Dialog header="Header" v-model:visible="displayModal" :breakpoints="{'960px': '75vw', '640px': '100vw'}" :style="{width: '50vw'}" :modal="false">
    <p class="p-m-0"></p>
    {{modalContent}}
    <!-- <template #footer>
        <Button label="No" icon="pi pi-times" @click="closeModal" class="p-button-text"/>
        <Button label="Yes" icon="pi pi-check" @click="closeModal" autofocus />
    </template> -->
</Dialog>
</template>
<script>
import { ref, reactive } from 'vue';
// import { onBeforeMount } from 'vue';
// import store from "../store";
// import { useRoute } from 'vue-router';
import axios from "axios";
import store from "../store";
import Chart from "../components/Chart.vue";

export default {
  name: "Search",
  // props: {
  //    datum: Object,
  // },
  setup() {
    // const vuerouter = useRoute();
    // const id = vuerouter.params.id;
    const modalContent  = ref('');
    const resp = ref({});
    const params = store.state.search;
    // const freq = ref([]);
    const freq = reactive({"data": [], "start": 1800, "end": 2021});
    const tokens = reactive([]);
    console.log("init params", params);
    const rules = {
      dpp: { min: 1, max: 50 },
      spd: { min: 1, max: 50 },
    }

    // onBeforeMount(async() => {
    // });

    const renderChart = async(e) => {
      if(params.token){
        try {
          const config = {
             // headers: { Authorization: "Bearer " + state.token },
           };
          const response = await axios.post("/api/freq", params,); // config);
          // resp.value = response.data;
          console.log("chart", response.data);
          freq.start  = Number(response.data["freq"][0][0]);
          freq.end = Number(response.data["freq"].slice(-1)[0][0]);
          freq.data = response.data["freq"].map(x => x[1]);
        } catch (error) {
          console.log("Cannot get data via API", error)
          return error;
        }
      }
    };

    const performQuery = async(isFull) => {
      if(params.token){
        try {
          const config = {
             // headers: { Authorization: "Bearer " + state.token },
           };
          const response = await axios.post("/api/query", {...params, "full": isFull? 1 : '' },); // config);
          resp.value = response.data;
        } catch (error) {
          console.log("Cannot get data via API", error)
          return error;
        }
      }
    };

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

      if(e && tokens[0] !== params.token) {
        const index = tokens.indexOf(params.token);
        if (index !== -1) {
          tokens.splice(index, 1);
        }
        tokens.unshift(params.token);
      }
      
      localStorage.setItem('token', params.token);
      localStorage.setItem('spd', params.spd);
      localStorage.setItem('dpp', params.dpp);
      console.log("data", params);
      await Promise.all([performQuery(), renderChart()]);
    };

    const displayModal = ref(false);
    const openModal = async(id) => {
        console.log("id", id);
        try{
          const response = await axios.post("/api/text", {"id": id});
          // console.log(response.data);
          modalContent.value = response.data;
          displayModal.value = true;
        } catch (error) {
          console.log("Cannot get data via API", error)
          return error;
        }
    };

    const closeModal = () => {
     displayModal.value = false;
   };
   const buttonItems = [{ label: 'Выгрузить всё', icon: 'pi pi-refresh', command: async () => await performQuery(true) },]

    return { onSubmit, resp, params, rules, displayModal, openModal, closeModal, modalContent, renderChart, freq, buttonItems, tokens, };
  },
  components: {
    Chart,
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

.mini-button {
  height: 1rem !important;
  width: 1rem !important;
}
.mini-button > .pi{
  font-size: 0.75rem;

}

.chart-holder {
  text-align: center;
  color: #2c3e50;
  max-width: 720px;
  margin: 10px auto;
  padding: 0 20px;
}
svg {
  /* important for responsiveness */
  display: block;
  fill: none;
  stroke: none;
  width: 100%;
  height: 100%;
  overflow: visible;
  background: #eee;
}
</style>
