<template>
  <nav class="navbar navbar-expand-lg navbar-custom">
    <div class="container">
      <router-link class="navbar-brand" to="/">
        <i class="bi bi-mortarboard-fill me-2"></i>
        منصة التعليم
      </router-link>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <!-- قائمة الأدمن -->
        <ul v-if="authStore.user?.role === 'admin'" class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/admin">
              <i class="bi bi-speedometer2 me-1"></i>
              لوحة التحكم
            </router-link>
          </li>
        </ul>

        <!-- قائمة الأستاذ -->
        <ul
          v-if="authStore.user?.role === 'teacher'"
          class="navbar-nav me-auto"
        >
          <li class="nav-item">
            <router-link class="nav-link" to="/teacher">
              <i class="bi bi-house-door me-1"></i>
              الرئيسية
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/teacher/questions">
              <i class="bi bi-question-circle me-1"></i>
              الأسئلة
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/teacher/exams">
              <i class="bi bi-journal-text me-1"></i>
              الامتحانات
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/teacher/files">
              <i class="bi bi-folder me-1"></i>
              الملفات
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/teacher/results">
              <i class="bi bi-bar-chart me-1"></i>
              النتائج
            </router-link>
          </li>
        </ul>

        <!-- قائمة الطالب -->
        <ul
          v-if="authStore.user?.role === 'student'"
          class="navbar-nav me-auto"
        >
          <li class="nav-item">
            <router-link class="nav-link" to="/student">
              <i class="bi bi-house-door me-1"></i>
              الرئيسية
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/student/files">
              <i class="bi bi-folder me-1"></i>
              الملفات
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/student/results">
              <i class="bi bi-bar-chart me-1"></i>
              نتائجي
            </router-link>
          </li>
        </ul>

        <!-- معلومات المستخدم -->
        <div class="user-info">
          <div
            class="user-avatar"
            :class="{ 'admin-avatar': authStore.user?.role === 'admin' }"
          >
            <i class="bi" :class="getUserIcon"></i>
          </div>
          <div class="user-details">
            <span class="user-name">{{ authStore.user?.name }}</span>
            <span class="user-role">{{ getRoleLabel }}</span>
          </div>
          <button class="btn btn-outline-light btn-sm ms-3" @click="logout">
            <i class="bi bi-box-arrow-right me-1"></i>
            خروج
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { computed } from "vue";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "vue-router";

export default {
  name: "HeaderComponent",
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();

    const getUserIcon = computed(() => {
      const role = authStore.user?.role;
      if (role === "admin") return "bi-shield-check";
      if (role === "teacher") return "bi-mortarboard-fill";
      return "bi-person-fill";
    });

    const getRoleLabel = computed(() => {
      const role = authStore.user?.role;
      if (role === "admin") return "مدير النظام";
      if (role === "teacher") return "أستاذ";
      return "طالب";
    });

    const logout = () => {
      authStore.logout();
      router.push("/login");
    };

    return { authStore, logout, getUserIcon, getRoleLabel };
  },
};
</script>

<style scoped>
.navbar-custom {
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
  padding: 12px 0;
  box-shadow: 0 4px 20px rgba(67, 97, 238, 0.3);
}

.navbar-brand {
  color: white !important;
  font-weight: 700;
  font-size: 1.4rem;
}

.navbar-toggler {
  border-color: rgba(255, 255, 255, 0.3);
}

.navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 0.8%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}

.nav-link {
  color: rgba(255, 255, 255, 0.9) !important;
  font-weight: 500;
  padding: 10px 16px !important;
  border-radius: 8px;
  margin: 0 2px;
  transition: all 0.3s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: white !important;
  background: rgba(255, 255, 255, 0.2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

.user-avatar {
  width: 42px;
  height: 42px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.user-avatar.admin-avatar {
  background: linear-gradient(135deg, #ffd166 0%, #f4a261 100%);
  color: #1a1a2e;
}

.user-details {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.user-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.user-role {
  font-size: 0.75rem;
  opacity: 0.8;
}

@media (max-width: 991px) {
  .user-info {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    width: 100%;
    justify-content: center;
  }
}
</style>
