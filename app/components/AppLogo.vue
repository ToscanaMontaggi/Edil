<script setup lang="ts">
withDefaults(defineProps<{ size?: 'normal' | 'large' }>(), { size: 'normal' })
</script>

<template>
  <div class="logo" :class="`logo--${size}`">
    <span class="logo__mark" aria-hidden="true">
      <i class="pi pi-building-columns" />
    </span>
    <span class="logo__text">
      <strong>Dinelli</strong>
      <small>Gestionale</small>
    </span>
  </div>
</template>

<style scoped>
.logo {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.logo__mark {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 10px;
  background: var(--p-primary-color);
  color: var(--p-primary-contrast-color);
  font-size: 1.1rem;
}

.logo__text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.logo__text strong {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.logo__text small {
  font-size: 0.72rem;
  color: var(--p-text-muted-color);
}

.logo--large .logo__mark {
  width: 3rem;
  height: 3rem;
  font-size: 1.5rem;
  border-radius: 13px;
}

.logo--large .logo__text strong {
  font-size: 1.35rem;
}

.logo--large .logo__text small {
  font-size: 0.85rem;
}
</style>
