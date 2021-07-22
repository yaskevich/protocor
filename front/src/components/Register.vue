<template>

  <div class="form-demo">
    <Dialog v-model:visible="showMessage" :breakpoints="{ '960px': '80vw' }" :style="{ width: '30vw' }" position="top">
      <div class="p-d-flex p-ai-center p-dir-col p-pt-6 p-px-3">
        <i class="pi pi-check-circle" :style="{fontSize: '5rem', color: 'var(--green-500)' }"></i>
        <h5>Пользователь зарегистрирован!</h5>
        <p :style="{lineHeight: 1.5, textIndent: '1rem'}">
          Учётная запись для адреса электронной почты <b>{{state.email}}</b> создана успешно!<br/> Перейдите, пожалуйста, по
          ссылке в письме для активации учётной записи.
        </p>
      </div>
      <template #footer>
          <div class="p-d-flex p-jc-center">
              <Button label="Хорошо!" @click="toggleDialog" class="p-button-text" />
          </div>
      </template>
    </Dialog>

    <div class="p-d-flex p-jc-center">
      <div class="card">
        <h5 class="p-text-center">Торжественная регистрация</h5>
        <form @submit.prevent="handleSubmit(!v$.$invalid)" class="p-fluid">
          <div class="p-field">
            <div class="p-float-label">
              <InputText id="firstname" v-model="v$.firstname.$model" :class="{'p-invalid':v$.firstname.$invalid && submitted}" />
              <label for="firstname" :class="{'p-error':v$.firstname.$invalid && submitted}">Имя*</label>
            </div>
            <small v-if="(v$.firstname.$invalid && submitted) || v$.firstname.$pending.$response" class="p-error">{{v$.firstname.required.$message.replace('Value', 'firstname')}}</small>
          </div>
          <div class="p-field">
            <div class="p-float-label">
              <InputText id="lastname" v-model="v$.lastname.$model" :class="{'p-invalid':v$.lastname.$invalid && submitted}" />
              <label for="lastname" :class="{'p-error':v$.lastname.$invalid && submitted}">Фамилия*</label>
            </div>
            <small v-if="(v$.lastname.$invalid && submitted) || v$.lastname.$pending.$response" class="p-error">{{v$.lastname.required.$message.replace('Value', 'lastname')}}</small>
          </div>

          <div class="p-field">
            <div class="p-float-label p-input-icon-right">
              <i class="pi pi-envelope" />
              <InputText id="email"
                         v-model="v$.email.$model"
                         :class="{'p-invalid':v$.email.$invalid && submitted}"
                         aria-describedby="email-error" />
              <label for="email" :class="{'p-error':v$.email.$invalid && submitted}">Email*</label>
            </div>
            <span v-if="v$.email.$error && submitted">
                                    <span id="email-error" v-for="(error, index) of v$.email.$errors" :key="index">
                                    <small class="p-error">{{error.$message}}</small>
                                    </span>
            </span>
            <small v-else-if="(v$.email.$invalid && submitted) || v$.email.$pending.$response" class="p-error">{{v$.email.required.$message.replace('Value', 'Email')}}</small>
          </div>
          <div class="p-field">
            <div class="p-float-label">
              <Password id="password" v-model="v$.password.$model" :class="{'p-invalid':v$.password.$invalid && submitted}" toggleMask>
                <template #header>
                  <h6>Pick a password</h6>
                </template>
                <template #footer="sp">
                    {{sp.level}}
                    <Divider />
                    <p class="p-mt-2">Suggestions</p>
                    <ul class="p-pl-2 p-ml-2 p-mt-0" style="line-height: 1.5">
                        <li>At least one lowercase</li>
                        <li>At least one uppercase</li>
                        <li>At least one numeric</li>
                        <li>Minimum 8 characters</li>
                    </ul>
                </template>
              </Password>
              <label for="password" :class="{'p-error':v$.password.$invalid && submitted}">Пароль*</label>
            </div>
            <small v-if="(v$.password.$invalid && submitted) || v$.password.$pending.$response" class="p-error">{{v$.password.required.$message.replace('Value', 'Password')}}</small>
          </div>
          <div class="p-field">
            <div class="p-float-label">
              <Calendar id="date" v-model="date" :showIcon="true" />
              <label for="date">Дата рождения</label>
            </div>
          </div>
          <!-- <div class="p-field">
                                <div class="p-float-label">
                                    <Dropdown id="country" v-model="country" :options="countries" optionLabel="name" />
                                    <label for="country">Country</label>
                                </div>
                            </div> -->
          <div class="p-field-checkbox">
            <Checkbox id="accept"
                      name="accept"
                      value="Accept"
                      v-model="v$.accept.$model"
                      :class="{'p-invalid':v$.accept.$invalid && submitted}" />
            <label for="accept" :class="{'p-error': v$.accept.$invalid && submitted}">Выражаю согласие с условиями пользования сайтом*</label>
          </div>
          <Button type="submit" label="Отправить" class="p-mt-2" />
        </form>
      </div>
    </div>
  </div>

</template>

<script>

  import { reactive, ref, onMounted } from 'vue';
  import { email, required } from '@vuelidate/validators';
  import { useVuelidate } from '@vuelidate/core';
  // import CountryService from './service/CountryService';
  import store from '../store';

  export default {
    setup() {
      onMounted(() => {
        // countryService.value.getCountries().then(data => countries.value = data);
      });

      const state = reactive({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        accept: null,
        sex: 1, // hardcoded, provide UI later!
      });

      const rules = {
        firstname: { required },
        lastname: { required },
        email: { required, email },
        password: { required },
        accept: { required },
      };

      // const countryService = ref(new CountryService());
      const submitted = ref(false);
      const countries = ref();
      const showMessage = ref(false);
      const date = ref();
      // const country = ref();

      const v$ = useVuelidate(rules, state);

      const handleSubmit = async(isFormValid) => {
        submitted.value = true;

        if (!isFormValid) {
          return;
        } else {
          // console.log("state", state);
          const result  = await store.regUser(state);
          console.log("reg", result);
          if(result?.data?.message){
            toggleDialog();
          }
        }

      };
      const toggleDialog = () => {
        showMessage.value = !showMessage.value;

        if (!showMessage.value) {
          resetForm();
        }
      };
      const resetForm = () => {
        state.firstname = '';
        state.lastname = '';
        state.email = '';
        state.password = '';
        state.date = null;
        // state.country = null;
        state.accept = null;
        submitted.value = false;
      };

      return {
        state,
        v$,
        handleSubmit,
        toggleDialog,
        submitted,
        // countries,
        showMessage,
        date,
        // country,
      };
    },
  };

</script>

<style lang="scss" scoped>

  .form-demo {
    .card {
      min-width: 450px;

      form {
        margin-top: 2rem;
      }

      .p-field {
        margin-bottom: 1.5rem;
      }
    }

    @media screen and (max-width: 960px) {
      .card {
        width: 80%;
      }
    }
  }

</style>
