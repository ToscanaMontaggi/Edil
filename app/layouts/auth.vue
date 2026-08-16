<template>
  <div class="auth">
    <div class="auth__panel">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: var(--space-4);
  background:
    radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--p-primary-color), transparent 86%), transparent 45%),
    radial-gradient(circle at 88% 82%, color-mix(in srgb, var(--p-primary-color), transparent 92%), transparent 40%),
    var(--p-surface-100);
}

.app-dark .auth {
  background:
    radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--p-primary-color), transparent 88%), transparent 45%),
    radial-gradient(circle at 88% 82%, color-mix(in srgb, var(--p-primary-color), transparent 94%), transparent 40%),
    var(--p-surface-950);
}

.auth__panel {
  width: 100%;
  max-width: 400px;
}
</style>
