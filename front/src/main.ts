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
import InputNumber from 'primevue/inputnumber';
import Dialog from 'primevue/dialog';
import SelectButton from 'primevue/selectbutton';
import Divider from 'primevue/divider';
import Toast from 'primevue/toast';
import AutoComplete from 'primevue/autocomplete';
import Inplace from 'primevue/inplace';
import MultiSelect from 'primevue/multiselect';
import Tag from 'primevue/tag';
import InputSwitch from 'primevue/inputswitch';
import Panel from 'primevue/panel';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Dropdown from 'primevue/dropdown';
import Badge from 'primevue/badge';
import ScrollTop from 'primevue/scrolltop';
import SplitButton from 'primevue/splitbutton';

import "@fontsource/fira-sans-extra-condensed" // Defaults to weight 400 with normal variant.
import "@fontsource/fira-sans-extra-condensed/400-italic.css" // Italic variant.
import "@fontsource/fira-sans-extra-condensed/700.css" // Bold variant.
import "@fontsource/fira-sans-extra-condensed/700-italic.css" // Bold italic variant.
import "@fontsource/fira-sans-extra-condensed/900.css" // Black variant.


createApp(App)
  .use(PrimeVue)
  .use(router)
  .component('Dialog', Dialog)
  .component('Button', Button)
  .component('SplitButton', SplitButton)
  .component('InputText', InputText)
  .component('InputNumber', InputNumber)
  .component('ScrollTop', ScrollTop)
  .component('Badge', Badge)
  .component('Dropdown', Dropdown)
  .component('TabView', TabView)
  .component('TabPanel', TabPanel)
  .component('Panel', Panel)
  .component('SelectButton', SelectButton)
  .component('InputSwitch', InputSwitch)
  .component('MultiSelect', MultiSelect)
  .component('Inplace', Inplace)
  .component('AutoComplete', AutoComplete)
  .component('Toast', Toast)
  .component('Divider', Divider)
  .component('Tag', Tag)
  .mount('#app');
