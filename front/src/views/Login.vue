<template>
  <div class="p-container " style="text-align:center;max-width:10rem;">
  <div class="p-field p-float-label">
      <InputText id="user-id" type="username" aria-describedby="user-id-help" class="p-invalid"  v-model="user.email" />
      <label for="user-id">Электронная почта</label>
      <small id="user-id-help" class="p-error">Username is not available.</small>
  </div>

  <div class="p-float-label p-mt-6">
  	<Password v-model="user.password" :feedback="false" toggleMask id="pwd"/>
  	<label for="pwd">Пароль</label>
  </div>

  <div class="p-mt-6">
    <Button label="Войти" @click="confirm" />
  </div>

  <!-- <el-form label-width="120px" ref="formRef" :model="user" :inline="true" :rules="rules">
    <el-form-item prop="email">
      <el-input placeholder="E-mail" v-model="user.email"></el-input>
    </el-form-item>
    <el-form-item prop="password">
      <el-input type="password" placeholder="Пароль" v-model="user.password" autocomplete="off"></el-input>
    </el-form-item>
    <el-button type="primary" @click="confirm">Войти</el-button>
    <div class="error">{{error}}</div>
  </el-form> -->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, ComponentPublicInstance } from 'vue';
import Password from 'primevue/password';
import store from "../store";

export default defineComponent({
  setup() {
    // const formRef = ref<ComponentPublicInstance<typeof ElForm>>();
    let user = reactive({email: '', password: ''});
    const error = ref('');

    // const resetForm = () => {
    //   formRef.value?.resetFields();
    // };
    const confirm = async () => {
        console.log("user/pass");
      // formRef.value?.validate(async(valid) => {
      //   if (valid) {
      //     console.log("ok send", user);
      //     // return false;
      //     error.value  = await store.doLogin(user);
      //     // if(!error.value) {
      //     //     // formRef.value?.resetFields();
      //     // }
      //     console.log(store.state);
      //   }  else{
      //     console.log("not valid");
      //     return false;
      //   }
      // });
    };


    return { confirm, user, error };
  },
  components: {
    Password
  }
});
</script>

<style lang="scss" scoped>
.sizes {
    .p-inputtext {
        display: block;
        margin-bottom: .5rem;

        &:last-child {
            margin-bottom: 0;
        }
    }
}

// .p-field * {
//     display: block;
// }
</style>
