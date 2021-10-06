<template>

  <div class="trends">

    <div>
      <Chip :label="item" removable v-for="item in store.state.trends" :key="item" @remove="removeToken(item)" class="p-mr-2" />
    </div>

    <div class="p-mt-2">
      <InputText type="text" v-model="token" @keyup.enter="addToken" />
      <Button icon='pi pi-plus' @click="addToken" class="p-button-secondary" />
    </div>

  </div>

  <div class="chart-holder">
    <Chart :tokens="value" v-for="value in store.state.trends" :key="value" class="p-mb-6" />
  </div>

</template>

<script>

  import { ref, reactive, defineComponent, onBeforeMount } from 'vue';
  import Chart from '../components/Chart.vue';
  import Chip from 'primevue/chip';
  import store from '../store';
  import axios from 'axios';

  export default defineComponent({
    setup() {
      const token = ref('');
      const history = ref([]);

      onBeforeMount(async () => {
        if (store.state.profile?.id) {
          const result = await store.getData('userlogs', 'trend');

          if (result.length) {
            store.state.trends = result[0].query.tokens;
            console.log('tr', store.state.trends);
            history.value = result;
          }
        }
      });

      const addToken = async () => {
        if (token.value) {
          token.value = token.value.trim();
          console.log('token', token.value);
          if (!store.state.trends.includes(token.value)) {
            store.state.trends.push(token.value);
            const config = {
              headers: { Authorization: 'Bearer ' + store.state.key },
            };
            if (store.state.key) {
              try {
                await axios.post('/api/auth/log', { tokens: store.state.trends }, config);
              } catch (error) {
                console.log('Cannot post', error);
              }
            }
          }
          token.value = '';
        }
      };

      const removeToken = val => {
        store.state.trends.splice(store.state.trends.indexOf(val), 1);
      };

      return {
        removeToken,
        addToken,
        token,
        store,
      };
    },
    components: {
      Chart,
      Chip,
    },
  });

</script>
