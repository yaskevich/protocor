<template>

  <div class="p-pb-4" v-if="count">
    Корпус содержит <span class="p-text-bold">{{zeropad(count)}}</span> текст{{countMascSg(count)}}
  </div>
  <div v-for="v in dict">
    <div class="p-grid p-jc-center p-mb-4">
      <Panel :header="v[0]['groupid']" style="min-width:300px;">
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

      const groupBy = key => array =>
        array.reduce((objectsByKeyValue, obj) => {
          const value = obj[key];
          objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
          return objectsByKeyValue;
        }, {});
      const groupByBrand = groupBy('groupid');

      const countMascSg = num => {
        const last = num.toString().slice(-1);
        return last == 1 ? '' : ['2', '3', '4'].includes(last) ? 'а' : 'ов';
      };

      const percent = (num, all) => {
           return ((num/all) * 100).toFixed(2);
      };

      onBeforeMount(async () => {
        const data = await store.getData('features/spoken');
        // console.log("data", data.value);
        counts.value = new Map(data.props.map(i => [i.prop, i.count]));
        dict.value = groupByBrand(data.dict);
        count.value = data.count;
      });

      return {
        dict,
        counts,
        count,
        countMascSg,
        zeropad: store.space000,
        percent,
      };
    },
    components: {},
  });

</script>
