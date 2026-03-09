<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo-icon">
            <i class="bi bi-mortarboard-fill"></i>
          </div>
          <h2>منصة التعليم الإلكتروني</h2>
          <p>سجل دخولك للمتابعة</p>
        </div>

        <form @submit.prevent="handleLogin">
          <div
            v-if="error"
            class="alert alert-danger d-flex align-items-center"
            role="alert"
          >
            <i class="bi bi-exclamation-circle-fill me-2"></i>
            {{ error }}
          </div>

          <div class="form-group">
            <label for="email">البريد الإلكتروني</label>
            <div class="input-wrapper">
              <i class="bi bi-envelope"></i>
              <input
                type="email"
                id="email"
                placeholder="أدخل البريد الإلكتروني"
                v-model="email"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password">كلمة المرور</label>
            <div class="input-wrapper">
              <i class="bi bi-lock"></i>
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                placeholder="أدخل كلمة المرور"
                v-model="password"
                required
              />
              <button
                type="button"
                class="toggle-password"
                @click="showPassword = !showPassword"
              >
                <i
                  class="bi"
                  :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"
                ></i>
              </button>
            </div>
          </div>

          <button type="submit" class="btn-login" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>
              <i class="bi bi-box-arrow-in-left me-2"></i>
              تسجيل الدخول
            </span>
          </button>
        </form>

        <div class="login-footer">
          <p>منصة تعليمية متكاملة للأساتذة والطلاب</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/authStore";

export default {
  name: "LoginPage",
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    const email = ref("");
    const password = ref("");
    const error = ref("");
    const loading = ref(false);
    const showPassword = ref(false);

    const handleLogin = async () => {
      error.value = "";
      loading.value = true;

      try {
        const result = await authStore.login(email.value, password.value);

        if (result.success) {
          if (result.role === "admin") {
            router.push("/admin");
          } else if (result.role === "teacher") {
            router.push("/teacher");
          } else {
            router.push("/student");
          }
        } else {
          error.value = result.message;
        }
      } catch (err) {
        error.value = "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.";
      } finally {
        loading.value = false;
      }
    };

    return {
      email,
      password,
      error,
      loading,
      showPassword,
      handleLogin,
    };
  },
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 50%, #7209b7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.login-page::before {
  content: "";
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 70%
  );
  animation: float 6s ease-in-out infinite;
}

.login-page::after {
  content: "";
  position: absolute;
  bottom: -50%;
  left: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.08) 0%,
    transparent 70%
  );
  animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(30px, 30px);
  }
}

.login-container {
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 1;
}

.login-card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  padding: 50px 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 35px;
}

.logo-icon {
  width: 90px;
  height: 90px;
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 10px 30px rgba(67, 97, 238, 0.4);
}

.logo-icon i {
  font-size: 45px;
  color: white;
}

.login-header h2 {
  color: #1a1a2e;
  font-weight: 700;
  font-size: 1.6rem;
  margin-bottom: 8px;
}

.login-header p {
  color: #6c757d;
  margin: 0;
  font-size: 0.95rem;
}

.form-group {
  margin-bottom: 22px;
}

.form-group label {
  display: block;
  color: #1a1a2e;
  font-weight: 600;
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper i {
  position: absolute;
  right: 16px;
  color: #6c757d;
  font-size: 1.1rem;
  pointer-events: none;
}

.input-wrapper input {
  width: 100%;
  padding: 16px 50px 16px 50px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #4361ee;
  background: white;
  box-shadow: 0 0 0 4px rgba(67, 97, 238, 0.1);
}

.input-wrapper input::placeholder {
  color: #adb5bd;
}

.toggle-password {
  position: absolute;
  left: 16px;
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  font-size: 1.1rem;
}

.toggle-password:hover {
  color: #4361ee;
}

.btn-login {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(67, 97, 238, 0.4);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 22px;
  height: 22px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.login-footer {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.login-footer p {
  color: #6c757d;
  margin: 0;
  font-size: 0.85rem;
}

.alert {
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 20px;
  border: none;
}

.alert-danger {
  background: #fff5f5;
  color: #c92a2a;
}

@media (max-width: 480px) {
  .login-card {
    padding: 40px 25px;
  }

  .logo-icon {
    width: 75px;
    height: 75px;
  }

  .logo-icon i {
    font-size: 38px;
  }
}
</style>
