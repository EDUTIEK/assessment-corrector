<script setup>
import {ref, computed} from "vue";
import {stores} from "@/store";
import Welcome from "@/components/Welcome.vue";
import AssessmentList from "@/components/AssessmentList.vue";

const login = ref('');
const password = ref('');
const accepted = ref(false);

const loginDialog = ref(false);
const loginMessage = ref('');

const agreementDialog = ref(false);
const agreementSending = ref(false);

const showAppBar = computed(() => !stores.layout().showWelcome);
const showReturnButton = computed(() => !!stores.config().returnUrl);
const showLogoutButton = computed(() => !stores.config().returnUrl && stores.api().userId);

function showLogin(show) {
  loginDialog.value = show;
  loginMessage.value = '';
}

function showAgreement(show) {
  agreementDialog.value = show;
}

async function sendLogin() {
  const result = await stores.api().sendLogin(login.value, password.value);
  if (result.ok) {
    showLogin(false);

    if (stores.user().hasToAccept) {
      showAgreement(true);
    } else {
      stores.api().loadAssessmentsFromBackend();
      stores.layout().setShowAssessmentList();
    }
  } else {
    loginMessage.value = result.message;
  }
}

async function sendAgreement() {
  if (accepted.value) {
    agreementSending.value = true;
    const result = await stores.api().sendAgreement();
    agreementSending.value = false;
    if (result.ok) {
      showAgreement(false);
      stores.api().loadAssessmentsFromBackend();
      stores.layout().setShowAssessmentList();
    }
  }
}

async function sendLogout() {
  await stores.api().sendLogout();
  stores.layout().setShowWelcome();
}

</script>

<template>
  <v-main fill-height>

    <v-app-bar v-if="showAppBar" elevation="1" color="white" density="compact">
      <v-app-bar-title>{{
          stores.api().isLoading ? $t('startupContentLoadData')
              : stores.layout().showAssessmentList ? $t('assessmentListHeading')
                : stores.layout().showItemList ? $t('itemListHeading') : ''
        }}</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn v-if="showReturnButton" :href="stores.config().returnUrl">
        <v-icon left icon="mdi-logout-variant"></v-icon>
        <span>{{ $t('startupContentMyCorrections') }}</span>
      </v-btn>
      <v-btn v-if="showLogoutButton" @click="sendLogout" :loading="stores.api().isSending">
        <v-icon left icon="mdi-logout-variant"></v-icon>
        <span>{{ $t('startupContentLogout') }}</span>
      </v-btn>
    </v-app-bar>

    <welcome v-if="stores.layout().showWelcome" @login="showLogin(true)"/>
    <assessment-list v-if="stores.layout().showAssessmentList"/>
    <item-list v-if="stores.layout().showItemList" />

    <!--
      Login
    -->
    <v-dialog max-width="60em" v-model="loginDialog">
      <v-card>
        <v-form @submit.prevent="sendLogin">
          <v-card-title>
            {{ $t('startupContentLoginTitle') }}
          </v-card-title>
          <v-card-text>
            <v-alert v-if="stores.layout().loginMessage" type="warning" variant="text" color="#0000A0">
              {{ stores.layout().loginMessage }}
            </v-alert>
            <v-text-field
                v-model="login"
                :label="$t('startupContentUserName')"
                name="login"
                autocomplete="username"
                @change="stores.layout().loginMessage = ''"
            ></v-text-field>
            <v-text-field
                v-model="password"
                :label="$t('startupContentPassword')"
                type="password"
                name="password"
                autocomplete="current-password"
                @change="stores.layout().loginMessage = ''"
            ></v-text-field>

          </v-card-text>
          <v-card-actions>
            <v-btn type="submit" variant="flat" color="primary" :loading="stores.api().isSending">
              <span>{{ $t('startupContentLogin') }}</span>
            </v-btn>
            <v-btn @click="showLogin(false)">
              <span>{{ $t('allCancel') }}</span>
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!--
      Agreement
    -->
    <v-dialog persistent  max-width="60em" v-model="agreementDialog">
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
            <v-btn type="submit" @click="sendLogout" :loading="stores.api().isSending && !agreementSending">
              <span>{{ $t('startupContentLogout') }}</span>
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <v-dialog persistent  max-width="60em" v-model="stores.layout().hasInitFailure">
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
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog persistent  max-width="60em" v-model="stores.layout().showItemLoadFailure">
      <v-card>
        <v-card-text>
          <p>{{ $t('startupContentLoadItemError') }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn v-show="showReturnButton" :href="stores.config().returnUrl">
            <v-icon left icon="mdi-logout-variant"></v-icon>
            <span>{{ $t('allEnd') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog persistent  max-width="60em" v-model="stores.layout().showDataReplaceConfirmation">
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

    <v-dialog persistent  max-width="60em" v-model="stores.layout().showItemReplaceConfirmation">
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

  v-main {
    background-color: #eef1f4;
  }

  .agreement {
    padding: 1em;

  }
</style>
