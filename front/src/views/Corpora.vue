<template>
  <div class="home">
    test
  </div>
</template>

<script>

  import { ref, reactive, defineComponent, onBeforeMount, } from 'vue';
  import store from '../store';

  export default defineComponent({
    setup() {
      const data = ref([]);

      onBeforeMount(async () => {

        if (store.state.profile?.id) {
          data.value = await store.getData('features/main');
          console.log("data", data.value);
        }

      });

      return {

      };
    },
    components: {
    },
  });

</script>
