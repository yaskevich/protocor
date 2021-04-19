<template>
<div id="main" v-if="dataReady">
  <div id="nav">
    <router-link to="/">Поиск</router-link> |
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
import { defineComponent, onBeforeMount, ref } from 'vue';
import store from "./store";
export default defineComponent({
  name: 'App',
  setup() {
     onBeforeMount(async() => {
       await store.getUser();
       dataReady.value = true;
       console.log('app → mounted!')
    })
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
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
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
