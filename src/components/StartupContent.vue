<script setup>
import {ref, computed, watch} from "vue";
import {stores} from "@/store";
import Welcome from "@/components/Welcome.vue";
import AssessmentList from "@/components/AssessmentList.vue";
import SummaryTemplate from '@/components/SummaryTemplate.vue';

const login = ref('');
const email = ref('');
const code = ref('');
const password = ref('');
const message = ref('');
const passwordRequestSent = ref(null);

const loginDialog = ref(false);
const agreementDialog = ref(false);
const passwordRequestDialog = ref(false);
const passwordCodeDialog = ref(false);
const passwordChangeDialog = ref(false);

const accepted = ref(false);
const agreementSending = ref(false);
const showPassword = ref(false);

const showAppBar = computed(() => !stores.layout().isWelcomeShown);
const showReturnButton = computed(() => !!stores.config().returnUrl);
const showLogoutButton = computed(() => !stores.config().returnUrl && stores.api().userId);
const disableSendPasswordRequest = ref(false);
let disableSendPasswordRequestTimer = null;

// wait 5 seconds after sending a password request before a next try is possible
watch(passwordRequestSent, () => {
  disableSendPasswordRequest.value = true;
  clearTimeout(disableSendPasswordRequestTimer);
  disableSendPasswordRequestTimer = setTimeout(() => {
    disableSendPasswordRequest.value = false;
  }, 5000);
});

// Definiere deine Regeln
const emailRules = {
  required: (value) => !!value || 'E-Mail ist erforderlich.',
  email: (value) => {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return pattern.test(value) || 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
  }
}

function showLogin(show) {
  login.value = '';
  code.value = '';
  login.value = '';
  email.value = '';
  password.value = '';
  message.value = '';
  loginDialog.value = show;
  if (!show) {
    showPassword.value = false;
  }
}

function hideDialogs() {
  loginDialog.value = false;
  agreementDialog.value = false;
  passwordRequestDialog.value = false;
  passwordCodeDialog.value = false;
  passwordChangeDialog.value = false;
}

function showAgreement(show) {
  agreementDialog.value = show;
}

function showPasswordRequest() {
  hideDialogs();
  passwordRequestDialog.value = true;
}

async function sendLogin() {
  const result = await stores.api().sendLogin(login.value, password.value);
  if (result.ok) {
    hideDialogs();
    if (stores.user().hasToAccept) {
      showAgreement(true);
    } else {
      loadAssessments();
    }
  } else {
    message.value = result.message;
  }
}

async function sendAgreement() {
  if (accepted.value) {
    agreementSending.value = true;
    const result = await stores.api().sendAgreement();
    agreementSending.value = false;
    if (result.ok) {
      hideDialogs();
      loadAssessments();
    }
  }
}

async function loadAssessments() {
  await stores.api().loadAssessmentsFromBackend();
  if (stores.assessments().countAssessments == 1 ) {
    for (const key in stores.assessments().assessments) {
      const assessment = stores.assessments().assessments[key];
      stores.layout().setShowItemList();
      stores.api().selectAssessment(assessment.ass_id, assessment.context_id);
      return;
    }
  }
  stores.layout().setShowAssessmentList();
}

async function sendLogout() {
  await stores.api().sendLogout();
  stores.layout().setShowWelcome();
}

async function sendPasswordRequest() {
  const result = await stores.api().sendPasswordRequest(email.value);
  passwordRequestSent.value = Date.now();
  if (result.ok) {
    hideDialogs();
    code.value = '';
    message.value = '';
    passwordCodeDialog.value = true;
  } else {
    message.value = result.message;
  }
}

async function sendPasswordCode() {
  const result = await stores.api().sendPasswordCode(login.value, code.value);
  if (result.ok) {
    hideDialogs();
    message.value = '';
    password.value = '';
    passwordChangeDialog.value = true;
  } else {
    message.value = result.message;
  }
}

async function sendPasswordChange() {
  const result = await stores.api().sendPasswordChange(login.value, code.value, password.value);
  if (result.ok) {
    hideDialogs();
    showLogin(true);
  } else {
    password.value = '';
    message.value = result.message;
  }
}

</script>

<template>
  <v-main fill-height>

    <v-app-bar v-if="showAppBar" elevation="1" color="white" density="compact">
      <v-app-bar-title>{{
          stores.api().isLoading ? $t('startupContentLoadData')
              : stores.layout().isAssessmentListShown ? $t('appMenuAssessments')
                : stores.layout().isItemListShown ? $t('appMenuItems')
                      : stores.layout().isTemplateShown ? $t('appMenuTemplate') : ''
        }}</v-app-bar-title>
      <v-spacer></v-spacer>
      <app-menu></app-menu>
    </v-app-bar>

    <welcome v-if="stores.layout().isWelcomeShown" @login="showLogin(true)"/>
    <assessment-list v-if="stores.layout().isAssessmentListShown"/>
    <item-list v-if="stores.layout().isItemListShown" />
    <summary-template  v-if="stores.layout().isTemplateShown" />

    <!--
      Login
    -->
    <v-dialog v-model="loginDialog" max-width="60em">
      <v-card>
        <v-form @submit.prevent="sendLogin">
          <v-card-title>
            {{ $t('startupContentLoginTitle') }}
          </v-card-title>
          <v-card-text>
            <v-alert v-if="message" type="warning" variant="text" color="#0000A0">
              {{ message }}
            </v-alert>
            <v-text-field
                v-model="login"
                :label="$t('startupContentUserName')"
                name="login"
                autocomplete="username"
                @change="message = ''"
            ></v-text-field>
            <v-text-field
                v-model="password"
                :label="$t('startupContentPassword')"
                :type="showPassword ? 'text' : 'password'"
                name="password"
                autocomplete="current-password"
                @change="message = ''"
            >
              <template #append-inner>
                <v-btn
                    :icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    :aria-label="showPassword ? $t('startupContentHidePassword') : $t('startupContentShowPassword')"
                    :aria-pressed="showPassword"
                    type="button"
                    variant="text"
                    size="small"
                    tabindex="0"
                    @mousedown.prevent
                    @click="showPassword = !showPassword"
                ></v-btn>
              </template>
            </v-text-field>

          </v-card-text>
          <v-card-actions>
            <v-btn type="submit" variant="flat" color="primary" :loading="stores.api().isSending">
              <span>{{ $t('startupContentLogin') }}</span>
            </v-btn>
            <v-btn @click="hideDialogs()">
              <span>{{ $t('allCancel') }}</span>
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn @click="showPasswordRequest()">
              <span>{{ $t('startupContentPasswordRequestTitle') }}</span>
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!--
      Password Request
    -->
    <v-dialog v-model="passwordRequestDialog" max-width="60em">
      <v-card>
        <v-form @submit.prevent="sendPasswordRequest">
          <v-card-title>
            {{ $t('startupContentPasswordRequestTitle') }}
          </v-card-title>
          <v-card-text>
            <v-alert v-if="message" type="warning" variant="text" color="#0000A0">
              {{ message }}
            </v-alert>
            <v-sheet>
              <p class="app-dialog-info">{{ $t('startupContentPasswordRequestInfo') }}</p>
            </v-sheet>
            <v-text-field
                v-model="email"
                :label="$t('startupContentEmail')"
                name="email"
                :rules="[emailRules.required, emailRules.email]"
                @change="message = ''"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-btn type="submit" variant="flat" color="primary" :loading="stores.api().isSending"
            :disabled="emailRules.email(email) !== true || disableSendPasswordRequest">
              <span>{{ $t('startupContentPasswordRequestSubmit') }}</span>
            </v-btn>
            <v-btn @click="hideDialogs()">
              <span>{{ $t('allCancel') }}</span>
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!--
      Password Code
    -->
    <v-dialog v-model="passwordCodeDialog" max-width="60em">
      <v-card>
        <v-form @submit.prevent="sendPasswordCode()">
          <v-card-title>
            {{ $t('startupContentPasswordCodeTitle') }}
          </v-card-title>
          <v-card-text>
            <v-alert v-if="message" type="warning" variant="text" color="#0000A0">
              {{ message }}
            </v-alert>
            <p class="app-dialog-info">{{ $t('startupContentPasswordCodeInfo') }}</p>
            <v-text-field
                v-model="login"
                :label="$t('startupContentUserName')"
                name="login"
                autocomplete="username"
                @change="message = ''"
            ></v-text-field>
            <v-text-field
                v-model="code"
                :label="$t('startupContentPasswordCode')"
                name="code"
                @change="message = ''"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-btn type="submit" variant="flat" color="primary" :loading="stores.api().isSending">
              <span>{{ $t('startupContentPasswordCodeSubmit') }}</span>
            </v-btn>
            <v-btn @click="hideDialogs()">
              <span>{{ $t('allCancel') }}</span>
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn @click="showPasswordRequest()" :disabled = "disableSendPasswordRequest">
              <span>{{ $t('startupContentPasswordCodeResend') }}</span>
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!--
      Password Change
    -->
    <v-dialog v-model="passwordChangeDialog" max-width="60em">
      <v-card>
        <v-form @submit.prevent="sendPasswordChange">
          <input type="hidden" name="code" :value="code" />
          <input type="hidden" name="email" :value="email" />
          <v-card-title>
            {{ $t('startupContentPasswordChangeTitle') }}
          </v-card-title>
          <v-card-text>
            <v-alert v-if="message" type="warning" variant="text" color="#0000A0">
              {{ message }}
            </v-alert>
            <p class="app-dialog-info">{{ $t('startupContentPasswordChangeInfo') }}</p>
            <v-text-field
                v-model="password"
                :label="$t('startupContentNewPassword')"
                :type="showPassword ? 'text' : 'password'"
                name="password"
                autocomplete="new-password"
                @change="message = ''"
            >
              <template #append-inner>
                <v-btn
                    :icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    :aria-label="showPassword ? $t('startupContentHidePassword') : $t('startupContentShowPassword')"
                    :aria-pressed="showPassword"
                    type="button"
                    variant="text"
                    size="small"
                    tabindex="0"
                    @mousedown.prevent
                    @click="showPassword = !showPassword"
                ></v-btn>
              </template>
            </v-text-field>

          </v-card-text>
          <v-card-actions>
            <v-btn type="submit" variant="flat" color="primary" :loading="stores.api().isSending">
              <span>{{ $t('startupContentChangePasswordSubmit') }}</span>
            </v-btn>
            <v-btn @click="hideDialogs()">
              <span>{{ $t('allCancel') }}</span>
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!--
      Agreement
    -->
    <v-dialog v-model="agreementDialog" persistent  max-width="60em">
      <v-card>
        <v-form @submit.prevent="sendAgreement">
          <v-card-title>
            {{ $t('startupContentAgreementTitle') }}
          </v-card-title>
          <v-card-text>
            <v-alert v-if="!stores.user().accepted" type="warning" variant="text" color="#0000A0">
              {{ $t('startupContentAgreementMessage')}}
            </v-alert>

            <div class="agreement" v-html="stores.user().agreement"></div>

            <v-checkbox
                v-model="accepted"
                :label="$t('startupContentAgreementCheckbox')"
            ></v-checkbox>
          </v-card-text>
          <v-card-actions>
            <v-btn type="submit" variant="flat" :disabled="!accepted" color="primary" :loading="agreementSending">
              <span>{{ $t('startupContentAgreementButton') }}</span>
            </v-btn>
            <v-btn @click="sendLogout" :loading="stores.api().isSending && !agreementSending">
              <span>{{ $t('startupContentLogout') }}</span>
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!--
      Init Failure
    -->
    <v-dialog v-model="stores.layout().hasInitFailure" persistent  max-width="60em">
      <v-card>
        <v-card-title>
          {{ $t('startupContentLoadError') }}
        </v-card-title>
        <v-card-text>
          <v-alert type="warning" variant="text" color="#0000A0" >
            {{ stores.layout().initFailure }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-btn v-show="showReturnButton" :href="stores.config().returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>{{ $t('allEnd') }}</span>
          </v-btn>
          <v-btn v-if="showLogoutButton" :loading="stores.api().isSending" @click="sendLogout">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>{{ $t('startupContentLogout') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!--
      Item Load Failure
     -->
    <v-dialog v-model="stores.layout().showItemLoadFailure" persistent  max-width="60em">
      <v-card>
        <v-card-text>
          <p>{{ $t('startupContentLoadItemError') }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn v-show="showReturnButton" :href="stores.config().returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>{{ $t('allEnd') }}</span>
          </v-btn>
          <v-btn v-if="showLogoutButton" :loading="stores.api().isSending" @click="sendLogout">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>{{ $t('startupContentLogout') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!--
       Data replace confirmation
    -->
    <v-dialog v-model="stores.layout().showDataReplaceConfirmation" persistent  max-width="60em">
      <v-card>
        <v-card-text>
          <p>{{ $t('startupContentDataReplaceInfo1') }}</p>
          <p><strong>{{ stores.tasks().currentTitle }}: {{
              stores.items().getItem(stores.api().storedItemKey,
                  { key: 0, title: 'Unbekannt' }).title
            }}</strong></p>
          <p>{{ $t('startupContentDataReplaceInfo2') }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="stores.api().initAfterReplaceDataConfirmed">
            <v-icon left icon="mdi-reload"></v-icon>
            <span>{{ $t('startupContentDeleteAndLoad') }}</span>
          </v-btn>
          <v-btn v-show="showReturn" :href="stores.config().returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>{{ $t('allCancel') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!--
      Item replace confirmation
    -->
    <v-dialog v-model="stores.layout().showItemReplaceConfirmation" persistent  max-width="60em">
      <v-card>
        <v-card-text>
          <p>{{ $t('startupContentItemReplaceInfo1') }}</p>
          <p><strong>{{ stores.tasks().currentTitle }}: {{
              stores.items().getItem(stores.api().storedItemKey,
                  { key: 0, title: 'Unbekannt' }).title
            }}</strong></p>
          <p>{{ $t('startupContentItemReplaceInfo2') }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="stores.api().initAfterKeepDataConfirmed">
            <v-icon left icon="mdi-pencil-outline"></v-icon>
            <span>{{ $t('startupContentKeepLocalData') }}</span>
          </v-btn>
          <v-btn @click="stores.api().initAfterReplaceDataConfirmed">
            <v-icon left icon="mdi-trash-can-outline"></v-icon>
            <span>{{ $t('startupContentDeleteLocalData') }}</span>
          </v-btn>
          <v-btn v-show="showReturnButton" :href="stores.config().returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>{{ $t('allCancel') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-main>
</template>


<style scoped>

  main {
    background-color: #eef1f4;
  }

  .agreement {
    padding: 1em;
  }

  .app-dialog-info {
    margin-top: 10px;
    margin-bottom: 10px;
  }
</style>
