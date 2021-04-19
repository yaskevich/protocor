<template>
<div class="p-d-flex p-jc-center">
      <div class="card">
          <h5 class="p-text-center">Register</h5>
          <form @submit.prevent="handleSubmit(!v$.$invalid)" class="p-fluid">
              <div class="p-field">
                  <div class="p-float-label">
                      <InputText id="name" v-model="v$.name.$model" :class="{'p-invalid':v$.name.$invalid && submitted}" />
                      <label for="name" :class="{'p-error':v$.name.$invalid && submitted}">Name*</label>
                  </div>
                  <small v-if="(v$.name.$invalid && submitted) || v$.name.$pending.$response" class="p-error">{{v$.name.required.$message.replace('Value', 'Name')}}</small>
              </div>
              <div class="p-field">
                  <div class="p-float-label p-input-icon-right">
                      <i class="pi pi-envelope" />
                      <InputText id="email" v-model="v$.email.$model" :class="{'p-invalid':v$.email.$invalid && submitted}" aria-describedby="email-error"/>
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
                      <label for="password" :class="{'p-error':v$.password.$invalid && submitted}">Password*</label>
                  </div>
                  <small v-if="(v$.password.$invalid && submitted) || v$.password.$pending.$response" class="p-error">{{v$.password.required.$message.replace('Value', 'Password')}}</small>
              </div>
              <div class="p-field">
                  <div class="p-float-label">
                      <Calendar id="date" v-model="date" :showIcon="true" />
                      <label for="date">Birthday</label>
                  </div>
              </div>
              <div class="p-field">
                  <div class="p-float-label">
                      <Dropdown id="country" v-model="country" :options="countries" optionLabel="name" />
                      <label for="country">Country</label>
                  </div>
              </div>
              <div class="p-field-checkbox">
                  <Checkbox id="accept" name="accept" value="Accept" v-model="v$.accept.$model" :class="{'p-invalid':v$.accept.$invalid && submitted}" />
                  <label for="accept" :class="{'p-error': v$.accept.$invalid && submitted}">I agree to the terms and conditions*</label>
              </div>
              <Button type="submit" label="Submit" class="p-mt-2" />
          </form>
      </div>
  </div>
</template>

<script>
import { reactive, ref, onMounted } from 'vue';
export default {
    setup() {
    }
</script>
