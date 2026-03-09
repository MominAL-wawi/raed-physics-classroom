<template>
  <div class="teacher-dashboard">
    <div class="container py-4">
      <!-- Welcome Header -->
      <div class="welcome-header mb-4">
        <div class="row align-items-center">
          <div class="col-md-8">
            <h2 class="mb-1">مرحباً بك، {{ authStore.user?.name }}</h2>
            <p class="text-muted mb-0">إدارة الأسئلة والامتحانات والملفات</p>
          </div>
          <div class="col-md-4 text-md-end">
            <span class="date-display">
              <i class="bi bi-calendar3 me-2"></i>
              {{ currentDate }}
            </span>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row g-4 mb-4">
        <div class="col-md-3 col-6">
          <div class="stats-card">
            <div class="stats-icon primary">
              <i class="bi bi-question-circle-fill"></i>
            </div>
            <div class="stats-content">
              <h3>{{ questionsStore.questions.length }}</h3>
              <p>الأسئلة</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="stats-card">
            <div class="stats-icon success">
              <i class="bi bi-journal-text"></i>
            </div>
            <div class="stats-content">
              <h3>{{ examsStore.exams.length }}</h3>
              <p>الامتحانات</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="stats-card">
            <div class="stats-icon warning">
              <i class="bi bi-folder-fill"></i>
            </div>
            <div class="stats-content">
              <h3>{{ filesStore.files.length }}</h3>
              <p>الملفات</p>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-6">
          <div class="stats-card">
            <div class="stats-icon danger">
              <i class="bi bi-people-fill"></i>
            </div>
            <div class="stats-content">
              <h3>{{ examsStore.results.length }}</h3>
              <p>النتائج</p>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- Quick Actions -->
        <div class="col-lg-6">
          <div class="section-card h-100">
            <div class="card-header">
              <h5><i class="bi bi-lightning-fill me-2"></i>إجراءات سريعة</h5>
            </div>
            <div class="card-body">
              <div class="action-buttons">
                <router-link to="/teacher/questions" class="action-btn primary">
                  <div class="action-icon">
                    <i class="bi bi-plus-circle-fill"></i>
                  </div>
                  <div class="action-text">
                    <span>إضافة سؤال</span>
                    <small>أضف أسئلة جديدة للامتحانات</small>
                  </div>
                  <i class="bi bi-chevron-left action-arrow"></i>
                </router-link>

                <router-link
                  to="/teacher/exams/create"
                  class="action-btn success"
                >
                  <div class="action-icon">
                    <i class="bi bi-journal-plus"></i>
                  </div>
                  <div class="action-text">
                    <span>إنشاء امتحان</span>
                    <small>أنشئ امتحان جديد للطلاب</small>
                  </div>
                  <i class="bi bi-chevron-left action-arrow"></i>
                </router-link>

                <router-link to="/teacher/files" class="action-btn warning">
                  <div class="action-icon">
                    <i class="bi bi-cloud-upload-fill"></i>
                  </div>
                  <div class="action-text">
                    <span>رفع ملف</span>
                    <small>شارك ملفات مع الطلاب</small>
                  </div>
                  <i class="bi bi-chevron-left action-arrow"></i>
                </router-link>

                <router-link to="/teacher/results" class="action-btn info">
                  <div class="action-icon">
                    <i class="bi bi-bar-chart-fill"></i>
                  </div>
                  <div class="action-text">
                    <span>عرض النتائج</span>
                    <small>تابع نتائج الطلاب</small>
                  </div>
                  <i class="bi bi-chevron-left action-arrow"></i>
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Results -->
        <div class="col-lg-6">
          <div class="section-card h-100">
            <div
              class="card-header d-flex justify-content-between align-items-center"
            >
              <h5 class="mb-0">
                <i class="bi bi-clock-history me-2"></i>آخر النتائج
              </h5>
              <router-link to="/teacher/results" class="btn btn-sm btn-light"
                >عرض الكل</router-link
              >
            </div>
            <div class="card-body">
              <div v-if="recentResults.length === 0" class="empty-state py-5">
                <div class="empty-icon">
                  <i class="bi bi-inbox"></i>
                </div>
                <h5>لا توجد نتائج بعد</h5>
                <p class="text-muted">
                  ستظهر هنا نتائج الطلاب بعد تقديم الامتحانات
                </p>
              </div>
              <div v-else class="results-list">
                <div
                  v-for="result in recentResults"
                  :key="result.id"
                  class="result-item"
                >
                  <div class="result-avatar">
                    <i class="bi bi-person-fill"></i>
                  </div>
                  <div class="result-info">
                    <strong>{{ result.studentName }}</strong>
                    <small>{{ result.examTitle }}</small>
                  </div>
                  <div
                    class="result-score"
                    :class="getScoreClass(result.score)"
                  >
                    {{ result.score }}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from "vue";
import { useAuthStore } from "@/store/authStore";
import { useQuestionsStore } from "@/store/questionsStore";
import { useExamsStore } from "@/store/examsStore";
import { useFilesStore } from "@/store/filesStore";

export default {
  name: "TeacherDashboard",
  setup() {
    const authStore = useAuthStore();
    const questionsStore = useQuestionsStore();
    const examsStore = useExamsStore();
    const filesStore = useFilesStore();

    // تحميل البيانات من Firebase عند تحميل الصفحة
    onMounted(async () => {
      await Promise.all([
        questionsStore.loadQuestions(),
        examsStore.loadExams(),
        examsStore.loadResults(),
        filesStore.loadFiles(),
      ]);
    });

    const currentDate = computed(() => {
      return new Date().toLocaleDateString("ar-SA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    });

    const recentResults = computed(() => {
      return examsStore.results.slice(-5).reverse();
    });

    const getScoreClass = (score) => {
      if (score >= 90) return "excellent";
      if (score >= 70) return "good";
      if (score >= 50) return "average";
      return "poor";
    };

    return {
      authStore,
      questionsStore,
      examsStore,
      filesStore,
      currentDate,
      recentResults,
      getScoreClass,
    };
  },
};
</script>

<style scoped>
.welcome-header h2 {
  color: #1a1a2e;
  font-weight: 700;
}

.date-display {
  color: #6c757d;
  font-size: 0.95rem;
}

.stats-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.stats-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stats-icon.primary {
  background: rgba(67, 97, 238, 0.1);
  color: #4361ee;
}
.stats-icon.success {
  background: rgba(6, 214, 160, 0.1);
  color: #06d6a0;
}
.stats-icon.warning {
  background: rgba(255, 209, 102, 0.1);
  color: #ffc107;
}
.stats-icon.danger {
  background: rgba(239, 71, 111, 0.1);
  color: #ef476f;
}

.stats-content h3 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.stats-content p {
  color: #6c757d;
  margin: 0;
  font-size: 0.9rem;
}

.section-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.section-card .card-header {
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
  color: white;
  padding: 18px 24px;
  border: none;
}

.section-card .card-header h5 {
  margin: 0;
  font-weight: 600;
}

.section-card .card-body {
  padding: 24px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.action-btn.primary {
  background: rgba(67, 97, 238, 0.08);
  border-color: rgba(67, 97, 238, 0.15);
}
.action-btn.success {
  background: rgba(6, 214, 160, 0.08);
  border-color: rgba(6, 214, 160, 0.15);
}
.action-btn.warning {
  background: rgba(255, 193, 7, 0.08);
  border-color: rgba(255, 193, 7, 0.15);
}
.action-btn.info {
  background: rgba(13, 202, 240, 0.08);
  border-color: rgba(13, 202, 240, 0.15);
}

.action-btn:hover {
  transform: translateX(-5px);
}

.action-btn.primary:hover {
  background: rgba(67, 97, 238, 0.15);
}
.action-btn.success:hover {
  background: rgba(6, 214, 160, 0.15);
}
.action-btn.warning:hover {
  background: rgba(255, 193, 7, 0.15);
}
.action-btn.info:hover {
  background: rgba(13, 202, 240, 0.15);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.action-btn.primary .action-icon {
  background: #4361ee;
  color: white;
}
.action-btn.success .action-icon {
  background: #06d6a0;
  color: white;
}
.action-btn.warning .action-icon {
  background: #ffc107;
  color: #1a1a2e;
}
.action-btn.info .action-icon {
  background: #0dcaf0;
  color: white;
}

.action-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.action-text span {
  font-weight: 600;
  color: #1a1a2e;
  font-size: 1rem;
}

.action-text small {
  color: #6c757d;
  font-size: 0.8rem;
}

.action-arrow {
  color: #adb5bd;
}

.empty-state {
  text-align: center;
  padding: 30px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  font-size: 2.5rem;
  color: #dee2e6;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.result-item:hover {
  background: #e9ecef;
}

.result-avatar {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.result-info strong {
  color: #1a1a2e;
  font-size: 0.95rem;
}

.result-info small {
  color: #6c757d;
}

.result-score {
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
}

.result-score.excellent {
  background: rgba(6, 214, 160, 0.15);
  color: #06d6a0;
}
.result-score.good {
  background: rgba(67, 97, 238, 0.15);
  color: #4361ee;
}
.result-score.average {
  background: rgba(255, 193, 7, 0.15);
  color: #d39e00;
}
.result-score.poor {
  background: rgba(239, 71, 111, 0.15);
  color: #ef476f;
}
</style>
