<template>
  <div class="about">
    <!-- <img alt="Vue logo" src="../assets/logo.png"> -->
    <!-- <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/> -->
    <p>Экспериментальные эксперименты с интерфейсом<br/> <a href="https://ruscorpora.ru" target="_blank">Национального корпуса русского языка</a>.</p>
    <p>
      Не пытайтесь повторить это дома!
    </p>
    <p>
      Проводит <a href="https://yaskevich.com/" target="_blank">Алексей Яскевич</a> (Лаб. № 20 ИППИ РАН)
    </p>
  </div>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import HelloWorld from '@/components/HelloWorld.vue'; // @ is an alias to /src

@Options({
  components: {
    HelloWorld,
  },
})
export default class About extends Vue {}
</script>
