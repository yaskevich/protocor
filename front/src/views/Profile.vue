<template>

  <div class="p-p-2">
      {{profile.firstname}} {{profile.lastname}}
  </div>
  <div class="p-p-2">
      {{profile.email}}
  </div>

</template>

<script>

  import { ref, reactive, defineComponent, onBeforeMount, } from 'vue';
  import store from '../store';
  import router from '../router';

  export default defineComponent({
    setup() {
      const history = ref([]);

      onBeforeMount(async () => {

        if (store.state.profile?.id) {
          history.value = await store.getData('userlogs/');
          console.log("hist", history.value);
        } else {
          router.push('/login');
        }

      });

      return {
        profile: store.state.profile,
      };
    },
    components: {
    },
  });

</script>
