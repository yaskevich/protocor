<template>

  <div class="p-d-flex p-jc-center">
    <div class="card">
      <h5 class="p-text-center">Вход</h5>
      <form @submit.prevent="confirm" class="p-fluid">
        <Dialog v-model:visible="showMessage" :breakpoints="{ '960px': '80vw' }" :style="{ width: '30vw' }" position="top">
          <div class="p-d-flex p-ai-center p-dir-col p-pt-6 p-px-3">
            <!-- <i class="pi pi-info-circle" :style="{fontSize: '5rem', color: 'red' }"></i> -->
            <!-- <h5>Проблемка!</h5> -->
            <p :style="{lineHeight: 1.5, textIndent: '1rem'}">
              Учётная запись для адреса электронной почты <b>{{user.email}}</b> с таким паролем либо не существует, либо Вы
              ввели неправильный пароль!<br/> <small>Если Вы забыли пароль, то Вы можете перейти по <a href="#">ссылке</a> для того, чтобы получить письмо с инструкциями по восстановлению доступа  к учётной записи.</small>
            </p>
          </div>
          <template #footer>
                <div class="p-d-flex p-jc-center">
                    <Button label="Попробовать еще!" @click="toggleDialog" class="p-button-text" />
                </div>
            </template>
        </Dialog>

        <div class="p-field p-float-label">
          <InputText id="user-id" type="username" aria-describedby="user-id-help" v-model="user.email" />
          <label for="user-id">Электронная почта</label>
        </div>

        <div class="p-float-label p-mt-6">
          <Password v-model="user.password" :feedback="false" toggleMask id="pwd" />
          <label for="pwd">Пароль</label>
        </div>

        <div class="p-mt-6">
          <Button label="Войти" @click="confirm" />
        </div>

        <Divider />

        <div class="p-mt-4 p-shadow-10 p-p-4 ">
          Нет учётной записи? Создать её можно
          <router-link to="/register">здесь</router-link>.
        </div>

      </form>
    </div>
  </div>

</template>

<script>

  import { defineComponent, ref, reactive, onBeforeMount, } from 'vue';
  import Password from 'primevue/password';
  import store from '../store';
  import router from '../router';

  export default defineComponent({
    setup() {
      let user = reactive({ email: '', password: '' });
      const error = ref('');
      const showMessage = ref(false);
      // const resetForm = () => {
      //   formRef.value?.resetFields();
      // };

      onBeforeMount(() => {
        if (store.state.profile?.id) {
          router.push('/profile');
        }
      });

      const confirm = async () => {
        console.log('user/pass', user);
        const error = await store.doLogin(user);
        if (error) {
          console.log('login', error);
          toggleDialog();
        } else {
          router.push('/profile');
        }
      };
      const toggleDialog = () => {
        showMessage.value = !showMessage.value;
      };

      return { confirm, user, error, showMessage, toggleDialog };
    },
    components: {
      Password,
    },
  });

</script>

<style lang="scss" scoped>

  .sizes {
    .p-inputtext {
      display: block;
      margin-bottom: 0.5rem;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  // .p-field * {
  //     display: block;
  // }

</style>
