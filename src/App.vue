<template>
  <div id="app">
    <HeaderComponent v-if="authStore.isLoggedIn" />
    <main class="main-content">
      <router-view />
    </main>
    <FooterComponent v-if="authStore.isLoggedIn" />
  </div>
</template>

<script>
import { useAuthStore } from "@/store/authStore";
import HeaderComponent from "@/components/HeaderComponent.vue";
import FooterComponent from "@/components/FooterComponent.vue";

export default {
  name: "App",
  components: {
    HeaderComponent,
    FooterComponent,
  },
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
};
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}
</style>
