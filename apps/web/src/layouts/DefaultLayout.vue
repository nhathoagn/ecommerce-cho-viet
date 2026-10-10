<script setup lang="ts">
import AppHeader from '../components/AppHeader.vue'
</script>
<template>
  <div class="app-layout">
    <AppHeader />
    <main><RouterView /></main>
    <footer class="footer"><div class="container"><strong>Chợ Việt</strong><span>Kết nối hàng Việt, trao gửi niềm tin.</span><span>© 2026 Chợ Việt Marketplace</span></div></footer>
  </div>
</template>
