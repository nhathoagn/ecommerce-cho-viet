<script setup lang="ts">
const features = ['Vue 3 storefront', 'NestJS API', 'MoMo Sandbox', 'Cloudflare R2']
</script>

<template>
  <main class="page-shell">
    <section class="hero">
      <span class="eyebrow">Ecommerce Marketplace</span>
      <h1>Source base đã sẵn sàng</h1>
      <p>Nền tảng bán hàng cho người mua và người bán, tích hợp MoMo và Cloudflare R2.</p>
      <div class="feature-grid">
        <article v-for="feature in features" :key="feature">{{ feature }}</article>
      </div>
    </section>
  </main>
</template>
