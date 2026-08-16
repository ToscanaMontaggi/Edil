<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Accedi — Dinelli Srl' })

const auth = useAuthStore()
const route = useRoute()

const email = ref('')
const password = ref('')
const submitted = ref(false)

const emailInvalid = computed(() => submitted.value && !email.value.includes('@'))
const passwordInvalid = computed(() => submitted.value && password.value.length < 6)

async function submit(): Promise<void> {
  submitted.value = true
  if (emailInvalid.value || passwordInvalid.value) return

  try {
    await auth.signIn({ email: email.value, password: password.value })
    await navigateTo((route.query.redirect as string) || '/')
  }
  catch {
    // Il messaggio e' gia' nello store: qui non serve altro.
  }
}
</script>

<template>
  <div class="u-stack">
    <div class="login__head">
      <AppLogo size="large" />
    </div>

    <Card>
      <template #title>
        Accedi
      </template>

      <template #subtitle>
        Inserisci le credenziali per entrare nel gestionale.
      </template>

      <template #content>
        <form class="u-stack" novalidate @submit.prevent="submit">
          <div class="u-stack" style="--stack-gap: var(--space-2)">
            <label for="email">Email</label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              autocomplete="username"
              placeholder="nome@azienda.it"
              :invalid="emailInvalid"
              fluid
            />
            <Message v-if="emailInvalid" severity="error" size="small" variant="simple">
              Inserisci un indirizzo email valido.
            </Message>
          </div>

          <div class="u-stack" style="--stack-gap: var(--space-2)">
            <label for="password">Password</label>
            <Password
              id="password"
              v-model="password"
              input-id="password"
              autocomplete="current-password"
              :feedback="false"
              toggle-mask
              :invalid="passwordInvalid"
              fluid
            />
            <Message v-if="passwordInvalid" severity="error" size="small" variant="simple">
              La password deve avere almeno 6 caratteri.
            </Message>
          </div>

          <Message v-if="auth.error" severity="error" size="small">
            {{ auth.error }}
          </Message>

          <Button
            type="submit"
            label="Entra"
            icon="pi pi-sign-in"
            :loading="auth.loading"
            fluid
          />
        </form>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.login__head {
  display: flex;
  justify-content: center;
  padding-bottom: var(--space-2);
}

label {
  font-size: 0.875rem;
  font-weight: 550;
}
</style>
