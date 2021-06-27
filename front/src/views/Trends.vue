<template>

  <div class="trends">
    <div class="p-mt-6">
      <Chip :label="item" removable v-for="item in tokens" :key="item" @remove="removeToken(item)" class="p-mr-2" />
    </div>
    <div class="p-mt-2">
      <InputText type="text" v-model="token" @keyup.enter="addToken" />
      <Button icon='pi pi-plus' @click="addToken" class="p-button-secondary" />
    </div>
  </div>
  <div class="chart-holder">
    <Chart :tokens="value" v-for="(value, key) in tokens" :key="value" class="p-mb-6" />
  </div>

</template>

<script>

  import { ref, reactive, defineComponent, } from 'vue';
  import Chart from '../components/Chart.vue';
  import Chip from 'primevue/chip';
  import store from '../store';

  export default defineComponent({
    setup() {
      const token = ref('');
      const tokens = reactive(['котик', 'лиса']);

      const addToken = async () => {
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
        tokens.splice(tokens.indexOf(val), 1);
      };

      return {
        removeToken,
        addToken,
        tokens,
        token,
      };
    },
    components: {
      Chart,
      Chip,
    },
  });

</script>
