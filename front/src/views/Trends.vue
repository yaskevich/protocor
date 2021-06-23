<template>

  <div class="trends">
    <div class="chart-holder">
      <Chart :data="freq.data" :start="freq.start" :end="freq.end" title="trends" />
    </div>
    <div class="p-mt-6">
      <Chip :label="item" removable v-for="item in tokens" :key="item" class="p-mr-2" @remove="removeToken(item)" />
      <InputText type="text" v-model="token" @keyup.enter="addToken" />
    </div>
  </div>

</template>


<script>

  import { ref, reactive, onBeforeMount, defineComponent, watch } from 'vue';
  import Chart from '../components/Chart.vue';
  import Chip from 'primevue/chip';
  import store from '../store';

  export default defineComponent({
    setup() {
      const token = ref('');
      const freq = reactive({ data: [], start: 1800, end: 2021 });
      const tokens = reactive([]);

      onBeforeMount(async () => {
        tokens.push('котик', 'лиса');
      });

      watch(
        () => tokens.length,
        async (count, prevCount) => {
          console.log('tokens len', count);
          for (let i = 0; i < tokens.length; i++) {
            // console.log('get', tokens[i]);
            await store.getFreq(tokens[i]);
          }
        }
      );

      const addToken = () => {
        if (token.value) {
          token.value = token.value.trim();
          console.log('token', token.value);
          if (!tokens.includes(token.value)) {
            tokens.push(token.value);
          }
          token.value = '';
        }
      };

      const removeToken = val => {
        console.log('val', val);
        tokens.splice(tokens.indexOf(val), 1);
      };

      const renderChart = async e => {};

      return {
        removeToken,
        addToken,
        renderChart,
        tokens,
        token,
        freq,
      };
    },
    components: {
      Chart,
      Chip,
    },
  });

</script>
