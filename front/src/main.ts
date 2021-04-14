import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import PrimeVue from 'primevue/config';
import 'primeflex/primeflex.css';
import 'primevue/resources/themes/saga-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';

createApp(App)
  .use(PrimeVue)
  .use(router)
  .component('Button', Button)
  .component('InputText', InputText)
  .mount('#app')
