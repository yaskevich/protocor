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

  import Chart from '../components/Chart.vue';
  import Chip from 'primevue/chip';
  import { ref, reactive, onBeforeMount, defineComponent, watch } from 'vue';
  import axios from 'axios';

  export default defineComponent({
    setup() {
      const token = ref('');
      const freq = reactive({ data: [], start: 1800, end: 2021 });
      const tokens = reactive([]);
      const tokensFreqs = reactive({});

      onBeforeMount(async() => {
        tokens.push('котик', 'лиса');

      });

      watch(
        () => tokens.length,
        (count, prevCount) => {
          console.log('tokens len', count);
          for (let i = 0; i < tokens.length; i++) {
            if(!(tokens[i] in tokensFreqs)) {
              console.log("get", tokens[i]);
              tokensFreqs[tokens[i]] = "ok";
            }
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

      const renderChart = async e => {
        if (tokens.value.length) {
          try {
            const config = {
              // headers: { Authorization: "Bearer " + state.token },
            };
            console.log('tokens', tokens.value);
            const response = await axios.post('/api/freq', { token: tokens.value[0] }); // config);
            // resp.value = response.data;
            console.log('chart', response.data);
            freq.start = Number(response.data['freq'][0][0]);
            freq.end = Number(response.data['freq'].slice(-1)[0][0]);
            // freq.data = response.data['freq'].map(Array.prototype.shift);
            freq.data = response.data['freq'].map(x => x[1]);
            console.log('freq', freq);
          } catch (error) {
            console.log('Cannot get data via API', error);
            return error;
          }
        }
      };

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
