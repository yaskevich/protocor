<template>
  <div class="about">
    <Search/>
  </div>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import Search from '@/components/Search.vue'; // @ is an alias to /src

@Options({
  components: {
    Search,
  },
})
export default class Home extends Vue {}
</script>
