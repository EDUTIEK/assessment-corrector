<script setup>
import {ref, computed, watch} from "vue";
import i18n from "@/plugins/i18n";
import { clearStartStores, stores } from "@/store";
import Welcome from "@/components/Welcome.vue";
import AssessmentList from "@/components/AssessmentList.vue";
import SummaryTemplate from '@/components/SummaryTemplate.vue';

const { t } = i18n.global;

const apiStore = stores.api();
const layoutStore = stores.layout();

const login = ref('');
const email = ref('');
const code = ref('');
const password = ref('');
const new_password = ref('');
const passwordRequestSent = ref(null);
const passwordRequestDialog = ref(false);

const accepted = ref(false);
const agreementSending = ref(false);
const showPassword = ref(false);
const showNewPassword = ref(false);

const showAppBar = computed(() => !layoutStore.isWelcomeShown);
const showReturnButton = computed(() => !!stores.config().returnUrl);
const showLogoutButton = computed(() => !stores.config().returnUrl && apiStore.userId);

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

const formatMessage = text => text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\r?\n/g, '<br />')

const emailRules = {
  required: (value) => !!value || 'E-Mail ist erforderlich.',
  email: (value) => {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return pattern.test(value) || 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
  }
}

function showLogin() {
  login.value = '';
  code.value = '';
  email.value = '';
  password.value = '';
  showPassword.value = false;
  layoutStore.startupMessage = '';
  layoutStore.showLoginDialog = true;
}

function hideDialogs() {
  passwordRequestDialog.value = false;
  layoutStore.startupMessage = '';
  layoutStore.showLoginDialog = false;
  layoutStore.showAgreementDialog = false;
  layoutStore.showPasswordCodeDialog = false;
  layoutStore.showPasswordChangeDialog = false;
}

function showAgreement() {
  hideDialogs();
  layoutStore.showAgreementDialog = true;
}

function showPasswordRequest() {
  hideDialogs();
  passwordRequestDialog.value = true;
}

function showPasswordChange() {
  hideDialogs();
  layoutStore.showPasswordChangeDialog = true;
}

async function sendLogin() {
  const result = await apiStore.sendLogin(login.value, password.value);
  if (result.ok) {
    showPassword.value = false;
    if (stores.user().hasToAccept) {
      showAgreement();
    } else if (stores.user().hasToChangePassword) {
      showPasswordChange();
    } else {
      loadAssessments();
    }
  } else {
    layoutStore.startupMessage = formatMessage(result.message);
  }
}

async function sendAgreement() {
  if (accepted.value) {
    agreementSending.value = true;
    const result = await apiStore.sendAgreement();
    agreementSending.value = false;
    if (result.ok) {
      if (stores.user().hasToChangePassword) {
        showPasswordChange();
      } else {
        loadAssessments();
      }
    }
  }
}

async function sendLogout() {
  await apiStore.sendLogout();
  layoutStore.setShowWelcome();
}

async function sendPasswordRequest() {
  const result = await apiStore.sendPasswordRequest(email.value);
  passwordRequestSent.value = Date.now();
  if (result.ok) {
    hideDialogs();
    code.value = '';
    layoutStore.startupMessage = '';
    layoutStore.showPasswordCodeDialog = true;
  } else {
    layoutStore.startupMessage = formatMessage(result.message);
  }
}

async function sendPasswordCode() {
  await clearStartStores();
  const result = await apiStore.sendPasswordCode(login.value, code.value);
  if (result.ok) {
    hideDialogs();
    layoutStore.startupMessage = '';
    password.value = '';
    layoutStore.showPasswordChangeDialog = true;
  } else {
    layoutStore.startupMessage = formatMessage(result.message);
  }
}

async function sendPasswordChange() {
  const result = await apiStore.sendPasswordChange(login.value, code.value, password.value, new_password.value);
  if (result.ok) {
    hideDialogs();
    showPassword.value = false;
    showNewPassword.value = false;
    await stores.user().setPasswordChanged();
    await stores.api().sendLogout();
    showLogin();
    layoutStore.startupMessage = t('startupContentPasswordChanged');
  } else {
    layoutStore.startupMessage = formatMessage(result.message);
  }
}

async function loadAssessments() {
  hideDialogs();
  await apiStore.loadAssessmentsFromBackend();
  for (const key in stores.assessments().assessments) {
    const assessment = stores.assessments().assessments[key];
    if (stores.assessments().countAssessments == 1
        || (assessment.ass_id == apiStore.assId && assessment.context_id == apiStore.contextId)
    ) {
      await apiStore.selectAssessment(assessment.ass_id, assessment.context_id);
      if (apiStore.itemKey && apiStore.itemByLink) {
        layoutStore.setShowItem();
      } else {
        layoutStore.setShowItemList();
      }
      return;
    }
  }
  layoutStore.setShowAssessmentList();
}

</script>

<template>
  <v-main fill-height>

    <v-app-bar v-if="showAppBar" elevation="1" color="white" density="compact">
      <v-app-bar-title>{{
          apiStore.isLoading ? $t('startupContentLoadData')
              : layoutStore.isAssessmentListShown ? $t('appMenuAssessments')
                : layoutStore.isItemListShown ? $t('appMenuItems')
                      : layoutStore.isTemplateShown ? $t('appMenuTemplate') : ''
        }}</v-app-bar-title>
      <v-spacer></v-spacer>
      <app-menu></app-menu>
    </v-app-bar>

    <welcome v-if="layoutStore.isWelcomeShown" @login="showLogin()"/>
    <assessment-list v-if="layoutStore.isAssessmentListShown"/>
    <item-list v-if="layoutStore.isItemListShown" />
    <summary-template  v-if="layoutStore.isTemplateShown" />

    <!--
      Login
    -->
    <v-dialog v-model="layoutStore.showLoginDialog" persistent max-width="60em">
      <v-card>
        <v-form @submit.prevent="sendLogin">
          <v-card-title>
            {{ $t('startupContentLoginTitle') }}
          </v-card-title>
          <v-card-text>
            <v-alert v-if="layoutStore.startupMessage" type="warning" variant="text" color="#0000A0">
              <div v-html="layoutStore.startupMessage"></div>
            </v-alert>
            <v-text-field
                v-model="login"
                :label="$t('startupContentUserName')"
                name="login"
                autocomplete="username"
                @change="layoutStore.startupMessage = ''"
            ></v-text-field>
            <v-text-field
                v-model="password"
                :label="$t('startupContentPassword')"
                :type="showPassword ? 'text' : 'password'"
                name="password"
                autocomplete="current-password"
                @change="layoutStore.startupMessage = ''"
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
            <v-btn type="submit" variant="flat" color="primary" :loading="apiStore.isSending">
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
    <v-dialog v-model="passwordRequestDialog" persistent max-width="60em">
      <v-card>
        <v-form @submit.prevent="sendPasswordRequest">
          <v-card-title>
            {{ $t('startupContentPasswordRequestTitle') }}
          </v-card-title>
          <v-card-text>
            <v-alert v-if="layoutStore.startupMessage" type="warning" variant="text" color="#0000A0">
              <div v-html="layoutStore.startupMessage"></div>
            </v-alert>
            <v-sheet>
              <p class="app-dialog-info">{{ $t('startupContentPasswordRequestInfo') }}</p>
            </v-sheet>
            <v-text-field
                v-model="email"
                :label="$t('startupContentEmail')"
                name="email"
                :rules="[emailRules.required, emailRules.email]"
                @change="layoutStore.startupMessage = ''"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-btn type="submit" variant="flat" color="primary" :loading="apiStore.isSending"
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
    <v-dialog v-model="layoutStore.showPasswordCodeDialog" persistent max-width="60em">
      <v-card>
        <v-form @submit.prevent="sendPasswordCode()">
          <v-card-title>
            {{ $t('startupContentPasswordCodeTitle') }}
          </v-card-title>
          <v-card-text>
            <v-alert v-if="layoutStore.startupMessage" type="warning" variant="text" color="#0000A0">
              <div v-html="layoutStore.startupMessage"></div>
            </v-alert>
            <p class="app-dialog-info">{{ $t('startupContentPasswordCodeInfo') }}</p>
            <v-text-field
                v-model="login"
                :label="$t('startupContentUserName')"
                name="login"
                autocomplete="username"
                @change="layoutStore.startupMessage = ''"
            ></v-text-field>
            <v-text-field
                v-model="code"
                :label="$t('startupContentPasswordCode')"
                name="code"
                @change="layoutStore.startupMessage = ''"
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-btn type="submit" variant="flat" color="primary" :loading="apiStore.isSending">
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
    <v-dialog v-model="layoutStore.showPasswordChangeDialog" persistent max-width="60em">
      <v-card>
        <v-form @submit.prevent="sendPasswordChange">
          <input type="hidden" name="code" :value="code" />
          <input type="hidden" name="email" :value="email" />
          <v-card-title>
            {{ $t('startupContentPasswordChangeTitle') }}
          </v-card-title>
          <v-card-text>
            <v-alert v-if="layoutStore.startupMessage" type="warning" variant="text" color="#0000A0">
              <div v-html="layoutStore.startupMessage"></div>
            </v-alert>
            <p v-if="!apiStore.userId" class="app-dialog-info">{{ $t('startupContentPasswordChangeInfo') }}</p>
            <p v-if="apiStore.userId" class="app-dialog-info">{{ $t('startupContentPasswordChangeExistingInfo') }}</p>
            <v-text-field
                v-if="apiStore.userId"
                v-model="password"
                :label="$t('startupContentOldPassword')"
                :type="showPassword ? 'text' : 'password'"
                name="password"
                autocomplete="current-password"
                @change="layoutStore.startupMessage = ''"
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
            <v-text-field
                v-model="new_password"
                :label="$t('startupContentNewPassword')"
                :type="showNewPassword ? 'text' : 'password'"
                name="new_password"
                autocomplete="new-password"
                @change="layoutStore.startupMessage = ''"
            >
              <template #append-inner>
                <v-btn
                    :icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    :aria-label="showNewPassword ? $t('startupContentHidePassword') : $t('startupContentShowPassword')"
                    :aria-pressed="showNewPassword"
                    type="button"
                    variant="text"
                    size="small"
                    tabindex="0"
                    @mousedown.prevent
                    @click="showNewPassword = !showNewPassword"
                ></v-btn>
              </template>
            </v-text-field>

          </v-card-text>
          <v-card-actions>
            <v-btn type="submit" variant="flat" color="primary" :loading="apiStore.isSending">
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
    <v-dialog v-model="layoutStore.showAgreementDialog" persistent  max-width="60em">
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
            <v-btn @click="sendLogout" :loading="apiStore.isSending && !agreementSending">
              <span>{{ $t('startupContentLogout') }}</span>
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!--
      Startup Failure
    -->
    <v-dialog v-model="layoutStore.showStartupFailureDialog" persistent  max-width="60em">
      <v-card>
        <v-card-title>
          {{ $t('startupContentFailureTitle') }}
        </v-card-title>
        <v-card-text>
          <v-alert type="warning" variant="text" color="#0000A0" >
            {{ layoutStore.startupMessage }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-btn v-show="showReturnButton" :href="stores.config().returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>{{ $t('allEnd') }}</span>
          </v-btn>
          <v-btn v-if="showLogoutButton" :loading="apiStore.isSending" @click="sendLogout">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>{{ $t('startupContentLogout') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!--
       Data replace confirmation
    -->
    <v-dialog v-model="layoutStore.showDataReplaceConfirmation" persistent  max-width="60em">
      <v-card>
        <v-card-text>
          <p>{{ $t('startupContentDataReplaceInfo1') }}</p>
          <p><strong>{{ stores.tasks().currentTitle }}: {{
              stores.items().getItem(apiStore.storedItemKey,
                  { key: 0, title: 'Unbekannt' }).title
            }}</strong></p>
          <p>{{ $t('startupContentDataReplaceInfo2') }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="apiStore.initAfterReplaceDataConfirmed">
            <v-icon left icon="mdi-reload"></v-icon>
            <span>{{ $t('startupContentDeleteAndLoad') }}</span>
          </v-btn>
          <v-btn v-show="showReturnButton" :href="stores.config().returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>{{ $t('allCancel') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!--
      Item replace confirmation
    -->
    <v-dialog v-model="layoutStore.showItemReplaceConfirmation" persistent  max-width="60em">
      <v-card>
        <v-card-text>
          <p>{{ $t('startupContentItemReplaceInfo1') }}</p>
          <p><strong>{{ stores.tasks().currentTitle }}: {{
              stores.items().getItem(apiStore.storedItemKey,
                  { key: 0, title: 'Unbekannt' }).title
            }}</strong></p>
          <p>{{ $t('startupContentItemReplaceInfo2') }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="apiStore.initAfterKeepDataConfirmed">
            <v-icon left icon="mdi-pencil-outline"></v-icon>
            <span>{{ $t('startupContentKeepLocalData') }}</span>
          </v-btn>
          <v-btn @click="apiStore.initAfterReplaceDataConfirmed">
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
