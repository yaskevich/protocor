<template>
  <div class="trends">
    <Chip label="кот" removable /> <InputText type="text" v-model="token" />
    <Chart />
  </div>
</template>


<script lang="ts">
import Chart from "../components/Chart.vue";
import Chip from 'primevue/chip';
import { ref, reactive, onBeforeMount, } from 'vue';
import { defineComponent } from 'vue'

export default defineComponent({
  setup() {
    const token = ref('');
    return {token};
  },
  components: {
    Chart,
    Chip,
  },
})
</script>
