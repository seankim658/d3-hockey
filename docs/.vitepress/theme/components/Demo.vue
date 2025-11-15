<template>
  <div class="demo-container">
    <div class="demo-header">
      <slot name="title">{{ title }}</slot>
    </div>
    <div class="demo-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'Demo'
  }
})
</script>

<style scoped>
.demo-container {
  margin: 2rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--vp-c-bg-soft);
}

.demo-header {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #003e7e 0%, #c8102e 100%);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

.demo-content {
  padding: 2rem 1rem;
  background-color: var(--vp-c-bg);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

@media (max-width: 768px) {
  .demo-content {
    padding: 1rem 0.5rem;
    min-height: 300px;
  }
}
</style>
