<template>
<div id="main" v-if="dataReady">
  <div id="nav">
    <router-link to="/">Поиск</router-link> |
    <router-link to="/trends">Тренды</router-link> |
    <router-link to="/about">Моё</router-link> |
    <span v-if="!loggedIn">
      <router-link to="/login">Войти</router-link>
    </span>
  </div>
  <router-view/>
</div>
<div v-else>
    загрузка...
</div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount, ref, computed, reactive } from 'vue';
import { useHead } from '@vueuse/head';
import store from "./store";
export default defineComponent({
  name: 'App',
  setup() {
     onBeforeMount(async() => {
       await store.getUser();
       dataReady.value = true;
       console.log('app → mounted!')
    })

    const siteData = reactive({
      title: "НКРЯ",
      // description: "Site of the National Corpus of Russian Language",
      description: "Сайт Национального корпуса русского языка",
    });

    useHead({
      // Can be static or computed
      title: computed(() => siteData.title),
      meta: [
        {
          name: `description`,
          content: computed(() => siteData.description),
        },
      ],
    });

     console.log("app → setup");
     const dataReady = ref(false);
     // const plusOne = computed(() => count.value + 1)
     return {
       dataReady,
       state: store.state,
       loggedIn: false
     };
    },
    // computed: {
    //   loggedIn() {
    //     return store.state.user && Object.keys(store.state.user).length;
    //   }
    // },
})
</script>


<style lang="scss">
#app, .p-inputtext, .p-component {
  /* font-family: Avenir, Helvetica, Arial, sans-serif; */
  font-family: 'Fira Sans Extra Condensed', sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  /* color: #2c3e50; */
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
