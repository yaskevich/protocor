<template>

  <div class="about">
    <!-- <img alt="Vue logo" src="../assets/logo.png"> -->
    <!-- <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/> -->
    <p>Экспериментальный прототип интерфейса<br/> <a href="https://ruscorpora.ru" target="_blank">Национального корпуса русского языка</a></p>

    <p><a href="https://yaskevich.com/" target="_blank">Алексей Яскевич</a> / <a href="https://ddrl.iitp.ru/" target="_blank">Лаб. № 20 ИППИ РАН</a></p>

    <div class="p-text-bold p-pb-1">Версии компонентов платформы</div>
    <div>
      Пользовательский интерфейс: {{version}}
    </div>
    <div>
      Серверное приложение: {{api.server}}
    </div>
    <div>
      Версия API: {{api.specs}}
    </div>

  </div>

</template>

<script>

  import { ref, reactive, defineComponent, onBeforeMount } from 'vue';
  import store from '../store';

  export default defineComponent({
    setup() {
      return {
        version: store.version,
        api: store.state.config,
      }
    },
    });

  </script>
