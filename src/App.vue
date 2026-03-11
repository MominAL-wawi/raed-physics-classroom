<template>
  <div id="app">
    <HeaderComponent v-if="authStore.isLoggedIn && !isExamPage" />
    <main class="main-content">
      <router-view />
    </main>
    <FooterComponent v-if="authStore.isLoggedIn && !isExamPage" />
  </div>
</template>

<script>
import { computed } from "vue";
import { useRoute } from "vue-router";
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
    const route = useRoute();

    // إخفاء الـ Header والـ Footer أثناء الامتحان
    const isExamPage = computed(() => {
      return route.path.includes("/exam/");
    });

    return { authStore, isExamPage };
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
