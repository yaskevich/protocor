<template>
  <div class="p-field">
    <span v-for="item in user.queries" :key="item">
      <!-- v-if="item !== params.token" -->
      <Button :label="item" class="p-button-sm p-button-plain p-button-text p-button-raised" @click="params.token = item; onSubmit($event);"/>
    </span>
  </div>

  <!-- <div class="p-d-flex p-jc-center p-mb-4">Запрос: <span class="p-text-bold p-pl-2">{{params.token}}</span></div> -->
  <div class="p-d-flex p-jc-center p-mb-4">
    <Button icon="pi pi-cog" @click="showSettings" class="p-button-secondary" />
    <InputText type="text" v-model="params.token" @keyup.enter="onSubmit($event)"/>
    <SelectButton v-model="gramMode" :options="gramButtonOptions" @click="clickGramMode">
      <template #option="slotProps">
                <i :class="slotProps.option.icon"></i>
            </template>
    </SelectButton>
     <Menu id="overlay_menu" ref="menu" :model="items" :popup="true" />

    <!-- <Button label="Искать" @click="onSubmit($event)" :disabled="!params.token ? 'disabled': null"/> -->
  </div>
  <div class="p-d-flex p-jc-center p-mb-4">
    <SplitButton label="Искать" @click="onSubmit" :model="buttonItems" :disabled="!params.token ? 'disabled': null"></SplitButton>
    <Button icon="pi pi-chart-line" @click="renderChart" class="p-button-success p-ml-2" :disabled="!params.token ? 'disabled': null"/>
  </div>

  <div class="chart-holder">
    <Chart :data="freq.data" :start="freq.start" :end="freq.end" :title="params.token"/>
  </div>

  <div v-if="resp.hasOwnProperty('corp_stat')" class="p-mt-4">
    <div class="">Корпус: {{store.space000(resp.corp_stat.stats[1].num)}} слов, {{store.space000(resp.corp_stat.stats[0].num)}} документов</div>
    <div>«<span class="p-text-bold">{{params.token}}</span>»: {{store.space000(resp.found_stat.stats[1].num)}} вхождений, {{store.space000(resp.found_stat.stats[0].num)}} документов</div>
    <Divider />
    <div v-for="(value, key) in resp.documents" class="p-mt-1 doc p-p-2 p-shadow-3" :key="key">
      <div v-for="(snippet, index) in value.snippets" class="p-mt-2 p-mb-2 snippet p-p-1" :key="index">
        <span v-for="(word, num) in snippet.words" :class="word.hit?'hit':''" :key="num">
          {{word.text}}
        </span>
        <Button icon="pi pi-heart" :class="'p-button-rounded mini-button' + (likeContexts.includes(snippet.expand_context_url)?'p-button-success':'p-button-primary p-button-text')"  @click="like(snippet)" />
      </div>
      <span class="source-title p-pr-2">
        {{value.document_info.title}}
        <Button icon="pi pi-search" class="p-button-rounded p-button-primary p-button-text mini-button"  @click="openModal(value.document_info.id)" />
      </span>
      <span v-if="value.document_info.homonymy !== 'омонимия снята'" class="note">{{value.document_info.homonymy}}</span>
    </div>
  </div>

  <Dialog :header="textInfo?.header" v-model:visible="displayModal" :breakpoints="{'960px': '75vw', '640px': '100vw'}" :style="{width: '30vw'}" :modal="false">
    <p class="p-m-0"></p>
    <template v-for="(value, key) in l10n">
      <div class="p-grid p-text-left" v-if="textInfo && textInfo[key]" :key="key">
              <div class="p-col-4 text-property" style="color: gray;">
                {{value}}</div>
              <div class="p-col">
                {{textInfo[key]}}
              </div>
      </div>
    </template>
    <!-- <template #footer>
        <Button label="No" icon="pi pi-times" @click="closeModal" class="p-button-text"/>
        <Button label="Yes" icon="pi pi-check" @click="closeModal" autofocus />
    </template> -->
</Dialog>

<Dialog header="Настройки выдачи" position="top" v-model:visible="displaySettings" :breakpoints="{'960px': '50vw', '640px': '100vw'}" :style="{width: '25vw'}" :modal="false">
  <div class="p-field">
     <label for="spd" class="p-pr-2 p-d-block">Примеров на документ</label>
     <!-- decrementButtonClass="p-button-danger" incrementButtonClass="p-button-success"  -->
     <InputNumber inputClass="num-input" id="spd" v-model="params.spd" showButtons buttonLayout="horizontal" :step="1"
         incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" :min="rules.spd.min" :max="rules.spd.max"
         @input="onSubmit($event)" />
   </div>
   <Divider/>
  <div class="p-field">
     <label for="dpp" class="p-pr-2 p-d-block">Документов на страницу</label>
     <InputNumber inputClass="num-input" id="dpp" v-model="params.dpp" showButtons buttonLayout="horizontal" :step="1"
         incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus" :min="rules.dpp.min" :max="rules.dpp.max"
         @input="onSubmit($event)"/>
   </div>
</Dialog>

</template>
<script>
import { ref, reactive, onBeforeMount, } from 'vue';
// import { onBeforeMount } from 'vue';
// import store from "../store";
// import { useRoute } from 'vue-router';
import axios from "axios";
import store from "../store";
import Chart from "../components/Chart.vue";
import Menu from 'primevue/menu';

export default {
  name: "Search",
  // props: {
  //    datum: Object,
  // },
  setup() {
    // const vuerouter = useRoute();
    // const id = vuerouter.params.id;
    const likeContexts = reactive([]);

    const textInfo  = ref({});
    const resp = ref({});
    const params = store.state.search;
    params.token = '';
    // const freq = ref([]);
    const freq = reactive({"data": [], "start": 1800, "end": 2021});
    const user = store.state.user;
    console.log("init params", params);
    const gramMode = ref();
    const gramButtonOptions = [
        {icon: 'pi pi-check', value: 'pos'},
        {icon: 'pi pi-filter', value: 'attrs'},
    ];
    const rules = {
      dpp: { min: 1, max: 50 },
      spd: { min: 1, max: 50 },
    };

    // { "birthday": "", "style": "нейтральный", "subcorpus": "ПК электронной коммуникации", "author": "коллективный", "type": "комментарии", "created": "2006-2010", "audience_size": "большая", "grsphere": "нехудожественная, электронная коммуникация", "header": "Форум: рецензии на фильм «Службный роман»", "medium": "электронный текст", "publ_year": "2006, 2007, 2008, 2009, 2010", "source": "Интернет", "words": "0", "sentences": "502", "title": "Форум: рецензии на фильм «Службный роман»", "audience_age": "н-возраст", "grtopic": "досуг, зрелища и развлечения, искусство и культура", "editor_id": "1", "id": "bWFpbi9zdGFuZGFyZC9wb3N0MTk1MC9mb3J1bS9lbGVjdHJvY29tL3NsdXpoZWJueWpfcm9tYW5fZGlzYW1iLnhtbA==", "tagging": "manual", "audience_level": "н-уровень" }

    const l10n =  {
      "style": "стиль",
      "grsphere": "сфера",
      "grtopic": "тематика",
      "subcorpus": "подкорпус",
      "tagging": "разметка",
      "author": "автор",
      "birthday": "день рожденья",
      "type": "тип",
      "created": "датировка",
      "medium": "носитель",
      "source": "источник",
      "words": "слов",
      "sentences": "предложений",
      "audience_size": "аудитория",
      "audience_age": "возраст",
      "audience_level": "сложность",
    };

    const menu = ref();
       const items = ref([
           {
               label: 'Options',
               items: [{
                   label: 'Update',
                   icon: 'pi pi-refresh',
               },
               {
                   label: 'Delete',
                   icon: 'pi pi-times',
               }
           ]},
           {
               label: 'Navigate',
               items: [{
                   label: 'Vue Website',
                   icon: 'pi pi-external-link',
               },
               {
                   label: 'Router',
                   icon: 'pi pi-upload',
               }
           ]}
       ]);


    onBeforeMount(async() => {
      const grammar  = await store.getData("grammar");
      // console.log("grammar", grammar);
      items.value = grammar.gramForm.s.map(x => ({
        label: grammar.dictionary[x],
         // icon: 'pi pi-upload',
      }));
      // console.log("Grammar items", items);

    });

    const renderChart = async(e) => {
      if(params.token){
        try {
          const config = {
             // headers: { Authorization: "Bearer " + state.token },
           };
          const response = await axios.post("/api/freq", params,); // config);
          // resp.value = response.data;
          // console.log("chart", response.data);
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
      if (params.token) {
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

        if(e && user.queries[0] !== params.token) {
          const index = user.queries.indexOf(params.token);
          if (index !== -1) {
            user.queries.splice(index, 1);
          }
          user.queries.unshift(params.token);
          localStorage.setItem('queries', JSON.stringify(user.queries));
        }

        // localStorage.setItem('token', params.token);
        localStorage.setItem('spd', params.spd);
        localStorage.setItem('dpp', params.dpp);
        console.log("query params", params);
        await Promise.all([performQuery(), renderChart()]);
      }
    };

    const displayModal = ref(false);
    const displaySettings = ref(false);

    const showSettings = () => {
        displaySettings.value = true;
    };

    const like = (data) => {
      console.log("like", data);
      likeContexts.push(data.expand_context_url);
    };

    const openModal = async(id) => {
        console.log("id", id);
        try{
          const response = await axios.post("/api/text", {"id": id});
          // console.log(response.data);
          textInfo.value = response.data;
          displayModal.value = true;
        } catch (error) {
          console.log("Cannot get data via API", error)
          return error;
        }
    };

    const closeModal = () => {
     displayModal.value = false;
   };

   const clickGramMode = (e) => {
     console.log("e", e, gramMode.value);
     // gramMode.value = undefined;
     menu.value.toggle(event);
   };
   const buttonItems = [{ label: 'Выгрузить всё', icon: 'pi pi-refresh', command: async () => await performQuery(true) },]

    return {
      onSubmit, resp, params, rules, displayModal,
      openModal, closeModal, textInfo, renderChart, freq,
      buttonItems, user, store, displaySettings, showSettings,
      l10n, gramMode, gramButtonOptions, clickGramMode, items, menu,
      like, likeContexts,
    };
  },
  components: {
    Chart, Menu,
  }
};
</script>
<style>
.source-title{
  color: silver;
  /* font-style: italic; */
  /*font-size: 0.75rem; */
}
.note{
  color: red;
  /* font-size: 0.75rem; */
}
.snippet{
  /* border: 1px dashed gray; */
  font-size:1.25rem;
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

.text-property:first-letter{
  text-transform: capitalize;
}
</style>
