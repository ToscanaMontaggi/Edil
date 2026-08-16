<script setup lang="ts">
import { NAVIGATION, PRIMARY_NAVIGATION } from '~/shared/navigation'

/**
 * Struttura dell'applicazione.
 *
 * Su desktop la barra laterale e' sempre visibile. Sotto i 1024 pixel sparisce e
 * la navigazione passa al pannello a scomparsa piu' alla barra inferiore con le
 * quattro voci usate ogni giorno, che sul telefono e' molto piu' comoda di un
 * menu da aprire ogni volta.
 */
const auth = useAuthStore()
const route = useRoute()
const { isDark, toggle: toggleDark } = useDarkMode()

const drawerOpen = ref(false)
const isDesktop = useMediaQuery('(min-width: 1024px)')

const currentTitle = computed(() =>
  NAVIGATION.find(item => item.to === route.path)?.label
  ?? NAVIGATION.find(item => item.to !== '/' && route.path.startsWith(item.to))?.label
  ?? 'Gestionale',
)

function isActive(to: string): boolean {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

// Cambiando pagina il pannello si chiude da solo: su telefono resterebbe aperto.
watch(() => route.fullPath, () => {
  drawerOpen.value = false
})

const userMenu = useTemplateRef<{ toggle: (event: Event) => void }>('userMenu')

const userMenuItems = computed(() => [
  { label: auth.user?.email ?? '', disabled: true },
  { separator: true },
  { label: 'Impostazioni', icon: 'pi pi-cog', command: () => navigateTo('/impostazioni') },
  { label: 'Esci', icon: 'pi pi-sign-out', command: () => auth.signOut() },
])
</script>

<template>
  <div class="shell">
    <aside v-if="isDesktop" class="shell__sidebar">
      <NuxtLink to="/" class="shell__brand">
        <AppLogo />
      </NuxtLink>

      <nav class="shell__nav" aria-label="Navigazione principale">
        <NuxtLink
          v-for="item in NAVIGATION"
          :key="item.to"
          :to="item.to"
          class="shell__link"
          :class="{ 'shell__link--active': isActive(item.to) }"
        >
          <i :class="item.icon" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="shell__sidebar-footer">
        <Button
          :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
          :label="isDark ? 'Tema chiaro' : 'Tema scuro'"
          severity="secondary"
          text
          fluid
          @click="toggleDark()"
        />
      </div>
    </aside>

    <div class="shell__main">
      <header class="shell__header">
        <Button
          v-if="!isDesktop"
          icon="pi pi-bars"
          severity="secondary"
          text
          rounded
          aria-label="Apri il menu"
          @click="drawerOpen = true"
        />

        <h1 class="shell__title">
          {{ currentTitle }}
        </h1>

        <div class="shell__header-actions">
          <Button
            v-if="!isDesktop"
            :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
            severity="secondary"
            text
            rounded
            :aria-label="isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'"
            @click="toggleDark()"
          />

          <Button
            severity="secondary"
            text
            rounded
            aria-label="Menu utente"
            aria-haspopup="true"
            @click="userMenu?.toggle($event)"
          >
            <Avatar
              :label="auth.displayName.charAt(0) || '?'"
              shape="circle"
              size="normal"
            />
          </Button>

          <Menu ref="userMenu" :model="userMenuItems" :popup="true" />
        </div>
      </header>

      <main class="shell__content">
        <slot />
      </main>

      <nav v-if="!isDesktop" class="shell__tabbar" aria-label="Navigazione rapida">
        <NuxtLink
          v-for="item in PRIMARY_NAVIGATION"
          :key="item.to"
          :to="item.to"
          class="shell__tab"
          :class="{ 'shell__tab--active': isActive(item.to) }"
        >
          <i :class="item.icon" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </div>

    <Drawer v-model:visible="drawerOpen" header=" " class="shell__drawer">
      <template #header>
        <AppLogo />
      </template>

      <nav class="shell__nav" aria-label="Navigazione principale">
        <NuxtLink
          v-for="item in NAVIGATION"
          :key="item.to"
          :to="item.to"
          class="shell__link"
          :class="{ 'shell__link--active': isActive(item.to) }"
        >
          <i :class="item.icon" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </Drawer>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100dvh;
}

.shell__sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  width: var(--app-sidebar-width);
  height: 100dvh;
  padding: var(--space-4) var(--space-3);
  background: var(--p-surface-0);
  border-right: 1px solid var(--p-surface-200);
}

.app-dark .shell__sidebar {
  background: var(--p-surface-900);
  border-right-color: var(--p-surface-800);
}

.shell__brand {
  padding: var(--space-2) var(--space-3) var(--space-5);
}

.shell__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.shell__link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0.7rem var(--space-3);
  border-radius: 10px;
  color: var(--p-text-muted-color);
  font-weight: 500;
  transition: background-color 0.15s, color 0.15s;
}

.shell__link i {
  font-size: 1.05rem;
  width: 1.25rem;
}

.shell__link:hover {
  background: var(--p-surface-100);
  color: var(--p-text-color);
}

.app-dark .shell__link:hover {
  background: var(--p-surface-800);
}

.shell__link--active {
  background: var(--p-primary-50);
  color: var(--p-primary-700);
  font-weight: 600;
}

.app-dark .shell__link--active {
  background: color-mix(in srgb, var(--p-primary-color), transparent 86%);
  color: var(--p-primary-color);
}

.shell__sidebar-footer {
  padding-top: var(--space-3);
  border-top: 1px solid var(--p-surface-200);
}

.app-dark .shell__sidebar-footer {
  border-top-color: var(--p-surface-800);
}

.shell__main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.shell__header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--app-header-height);
  padding: 0 var(--space-4);
  background: color-mix(in srgb, var(--p-surface-0), transparent 20%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--p-surface-200);
}

.app-dark .shell__header {
  background: color-mix(in srgb, var(--p-surface-900), transparent 20%);
  border-bottom-color: var(--p-surface-800);
}

.shell__title {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 650;
}

.shell__header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.shell__content {
  flex: 1;
  width: 100%;
  max-width: var(--app-content-max);
  margin: 0 auto;
  padding: var(--space-5) var(--space-4);
}

/* Barra inferiore: solo su telefono e tablet stretto. */
.shell__tabbar {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: var(--p-surface-0);
  border-top: 1px solid var(--p-surface-200);
  /* Spazio per la barra gesti degli iPhone. */
  padding-bottom: env(safe-area-inset-bottom);
}

.app-dark .shell__tabbar {
  background: var(--p-surface-900);
  border-top-color: var(--p-surface-800);
}

.shell__tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0.55rem 0.25rem;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--p-text-muted-color);
}

.shell__tab i {
  font-size: 1.15rem;
}

.shell__tab--active {
  color: var(--p-primary-color);
}

@media (max-width: 1023px) {
  .shell__content {
    padding: var(--space-4) var(--space-3);
  }
}
</style>
