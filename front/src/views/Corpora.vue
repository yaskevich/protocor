<template>
  <div class="p-pb-2">
    <Dropdown v-model="selectedCorpus" :options="corpora" optionValue="id" optionLabel="name" :filter="true" placeholder="Выберите корпус" @change="updateCorpusMeta"/>
  </div>
  <div class="p-pb-4" v-if="count">
    Корпус содержит <span class="p-text-bold">{{zeropad(count)}}</span> текст{{countNoun(count)}}
  </div>
  <div v-for="v in dict">
    <div class="p-grid p-jc-center p-mb-4">
      <Panel :header="fields[v[0]['groupid']]||'! '+v[0]['groupid']" style="min-width:300px;" :toggleable="true" :collapsed="!['audience_age', 'audience_level', 'audience_size', 'created', 'medium'].includes(v[0]['groupid'])">
        <div v-for="obj in v" class="p-grid p-ai-center vertical-container p-pb-2" :title="percent(counts.get(obj.id), count)">
          <div class="p-col p-text-left">{{obj.ru}}</div>
          <div class="p-col p-text-right">{{counts.get(obj.id)}}</div>
        </div>
      </Panel>
    </div>
  </div>

</template>

<script>

  import { ref, reactive, defineComponent, onBeforeMount } from 'vue';
  import store from '../store';

  export default defineComponent({
    setup() {
      const dict = ref([]);
      const counts = ref();
      const count = ref(0);
      const fields = ref({});
      const corpora= ref([]);
      const selectedCorpus = ref('spoken');

      const groupBy = key => array =>
        array.reduce((objectsByKeyValue, obj) => {
          const value = obj[key];
          objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
          return objectsByKeyValue;
        }, {});
      const groupByBrand = groupBy('groupid');

      const percent = (num, all) => {
           return ((num/all) * 100).toFixed(2);
      };


      const loadCorpusMeta = async(corpus) => {
        const data = await store.getData('features/'+corpus);
        // console.log("data", data.value);
        counts.value = new Map(data.props.map(i => [i.prop, i.count]));
        dict.value = groupByBrand(data.dict);
        count.value = data.count;
        fields.value = data.meta;
        corpora.value = data.corpora;
        selectedCorpus.value  = corpus;
      }

      onBeforeMount(async () => {
        await loadCorpusMeta('spoken');
      });

      const updateCorpusMeta = async(e) => {
        await loadCorpusMeta(e.value);
      };

      return {
        dict,
        counts,
        count,
        zeropad: store.space000,
        percent,
        countNoun: store.countNoun,
        fields,
        corpora,
        selectedCorpus,
        updateCorpusMeta,
      };
    },
    components: {},
  });

</script>
