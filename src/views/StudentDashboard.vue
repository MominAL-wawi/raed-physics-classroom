<template>
  <div class="student-dashboard">
    <div class="container py-4">
      <!-- Welcome Header -->
      <div class="welcome-section mb-4">
        <div class="welcome-card">
          <div class="welcome-content">
            <div class="welcome-icon">
              <i class="bi bi-mortarboard-fill"></i>
            </div>
            <div class="welcome-text">
              <h2>مرحباً، {{ authStore.user?.name }}</h2>
              <p>استعرض الامتحانات المتاحة والملفات التعليمية</p>
            </div>
          </div>
          <div class="welcome-stats">
            <div class="stat-item">
              <span class="stat-value">{{ availableExams.length }}</span>
              <span class="stat-label">امتحان متاح</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ completedExamsCount }}</span>
              <span class="stat-label">امتحان مكتمل</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Available Exams -->
      <div class="section-card mb-4">
        <div
          class="card-header d-flex justify-content-between align-items-center"
        >
          <h5 class="mb-0">
            <i class="bi bi-journal-text me-2"></i>
            الامتحانات المتاحة
          </h5>
        </div>
        <div class="card-body">
          <div v-if="availableExams.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="bi bi-journal-x"></i>
            </div>
            <h4>لا توجد امتحانات متاحة</h4>
            <p class="text-muted">سيتم إعلامك عند توفر امتحانات جديدة</p>
          </div>

          <div v-else class="row g-4">
            <div
              v-for="exam in availableExams"
              :key="exam.id"
              class="col-md-6 col-lg-4"
            >
              <div
                class="exam-card"
                :class="{ completed: hasCompletedExam(exam.id) }"
              >
                <div class="exam-status" v-if="hasCompletedExam(exam.id)">
                  <i class="bi bi-check-circle-fill"></i>
                  مكتمل
                </div>
                <div class="exam-icon">
                  <i class="bi bi-journal-bookmark-fill"></i>
                </div>
                <h5 class="exam-title">{{ exam.title }}</h5>
                <p class="exam-description">
                  {{ exam.description || "لا يوجد وصف" }}
                </p>
                <div class="exam-meta">
                  <span>
                    <i class="bi bi-question-circle"></i>
                    {{ exam.questions.length }} سؤال
                  </span>
                  <span>
                    <i class="bi bi-clock"></i>
                    {{ exam.duration }} دقيقة
                  </span>
                </div>

                <div v-if="hasCompletedExam(exam.id)" class="exam-result mt-3">
                  <span class="result-badge" :class="getResultClass(exam.id)">
                    النتيجة: {{ getExamResult(exam.id) }}%
                  </span>
                </div>
                <router-link
                  v-else
                  :to="`/student/exam/${exam.id}`"
                  class="btn-start-exam"
                >
                  <i class="bi bi-play-fill me-1"></i>
                  بدء الامتحان
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Files -->
      <div class="section-card">
        <div
          class="card-header d-flex justify-content-between align-items-center"
        >
          <h5 class="mb-0">
            <i class="bi bi-folder-fill me-2"></i>
            الملفات التعليمية
          </h5>
          <router-link to="/student/files" class="btn btn-sm btn-light">
            عرض الكل
            <i class="bi bi-chevron-left ms-1"></i>
          </router-link>
        </div>
        <div class="card-body">
          <div v-if="recentFiles.length === 0" class="empty-state py-5">
            <div class="empty-icon small">
              <i class="bi bi-folder-x"></i>
            </div>
            <p class="text-muted mb-0">لا توجد ملفات متاحة حالياً</p>
          </div>

          <div v-else class="files-grid">
            <div v-for="file in recentFiles" :key="file.id" class="file-item">
              <div class="file-icon" :class="getFileIconClass(file.type)">
                <i class="bi" :class="getFileIcon(file.type)"></i>
              </div>
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-date">{{ formatDate(file.uploadedAt) }}</span>
              </div>
              <a :href="file.url" target="_blank" class="file-download">
                <i class="bi bi-download"></i>
              </a>
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
import { useExamsStore } from "@/store/examsStore";
import { useFilesStore } from "@/store/filesStore";

export default {
  name: "StudentDashboard",
  setup() {
    const authStore = useAuthStore();
    const examsStore = useExamsStore();
    const filesStore = useFilesStore();

    // تحميل البيانات من Firebase عند تحميل الصفحة
    onMounted(async () => {
      await Promise.all([
        examsStore.loadExams(),
        examsStore.loadResults(),
        filesStore.loadFiles(),
      ]);
    });

    const availableExams = computed(() => examsStore.getActiveExams);
    const recentFiles = computed(() => filesStore.files.slice(-6));

    const completedExamsCount = computed(() => {
      return examsStore.results.filter(
        (r) => r.studentEmail === authStore.user?.email
      ).length;
    });

    const hasCompletedExam = (examId) => {
      return examsStore.hasStudentTakenExam(examId, authStore.user?.email);
    };

    const getExamResult = (examId) => {
      const result = examsStore.results.find(
        (r) => r.examId === examId && r.studentEmail === authStore.user?.email
      );
      return result ? result.score : 0;
    };

    const getResultClass = (examId) => {
      const score = getExamResult(examId);
      if (score >= 90) return "excellent";
      if (score >= 70) return "good";
      if (score >= 50) return "average";
      return "poor";
    };

    const getFileIcon = (type) => {
      if (type === "pdf") return "bi-file-pdf-fill";
      if (type === "image") return "bi-file-image-fill";
      return "bi-file-earmark-fill";
    };

    const getFileIconClass = (type) => {
      if (type === "pdf") return "pdf";
      if (type === "image") return "image";
      return "default";
    };

    const formatDate = (dateString) => {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("ar-SA");
    };

    return {
      authStore,
      availableExams,
      recentFiles,
      completedExamsCount,
      hasCompletedExam,
      getExamResult,
      getResultClass,
      getFileIcon,
      getFileIconClass,
      formatDate,
    };
  },
};
</script>

<style scoped>
.welcome-card {
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
  border-radius: 20px;
  padding: 30px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 10px 40px rgba(67, 97, 238, 0.3);
}

.welcome-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.welcome-icon {
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.welcome-text h2 {
  margin: 0 0 5px;
  font-weight: 700;
  font-size: 1.5rem;
}

.welcome-text p {
  margin: 0;
  opacity: 0.9;
}

.welcome-stats {
  display: flex;
  align-items: center;
  gap: 25px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.9;
}

.stat-divider {
  width: 1px;
  height: 50px;
  background: rgba(255, 255, 255, 0.3);
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

.empty-state {
  text-align: center;
  padding: 50px 20px;
}

.empty-icon {
  width: 100px;
  height: 100px;
  background: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 3rem;
  color: #dee2e6;
}

.empty-icon.small {
  width: 60px;
  height: 60px;
  font-size: 1.8rem;
}

.empty-state h4 {
  color: #495057;
  margin-bottom: 8px;
}

.exam-card {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 24px;
  height: 100%;
  transition: all 0.3s ease;
  position: relative;
  border: 2px solid transparent;
}

.exam-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border-color: #4361ee;
}

.exam-card.completed {
  background: rgba(6, 214, 160, 0.08);
  border-color: rgba(6, 214, 160, 0.3);
}

.exam-status {
  position: absolute;
  top: 15px;
  left: 15px;
  background: #06d6a0;
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
}

.exam-icon {
  width: 55px;
  height: 55px;
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  margin-bottom: 16px;
}

.exam-title {
  color: #1a1a2e;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.exam-description {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 15px;
  line-height: 1.5;
}

.exam-meta {
  display: flex;
  gap: 18px;
  color: #6c757d;
  font-size: 0.85rem;
  margin-bottom: 5px;
}

.exam-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-start-exam {
  display: block;
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  margin-top: 15px;
  transition: all 0.3s ease;
}

.btn-start-exam:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(67, 97, 238, 0.4);
  color: white;
}

.result-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
}

.result-badge.excellent {
  background: rgba(6, 214, 160, 0.15);
  color: #06d6a0;
}
.result-badge.good {
  background: rgba(67, 97, 238, 0.15);
  color: #4361ee;
}
.result-badge.average {
  background: rgba(255, 193, 7, 0.15);
  color: #d39e00;
}
.result-badge.poor {
  background: rgba(239, 71, 111, 0.15);
  color: #ef476f;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.file-item:hover {
  background: #e9ecef;
}

.file-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.file-icon.pdf {
  background: rgba(239, 71, 111, 0.15);
  color: #ef476f;
}
.file-icon.image {
  background: rgba(6, 214, 160, 0.15);
  color: #06d6a0;
}
.file-icon.default {
  background: rgba(67, 97, 238, 0.15);
  color: #4361ee;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.file-name {
  color: #1a1a2e;
  font-weight: 600;
  font-size: 0.95rem;
}

.file-date {
  color: #6c757d;
  font-size: 0.8rem;
}

.file-download {
  width: 38px;
  height: 38px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4361ee;
  transition: all 0.3s ease;
}

.file-download:hover {
  background: #4361ee;
  color: white;
}

@media (max-width: 768px) {
  .welcome-card {
    flex-direction: column;
    gap: 25px;
    text-align: center;
  }

  .welcome-content {
    flex-direction: column;
  }

  .stat-divider {
    width: 50px;
    height: 1px;
  }
}
</style>
