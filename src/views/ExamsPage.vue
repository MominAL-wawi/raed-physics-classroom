<template>
  <div class="dashboard-container">
    <div class="container">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2><i class="bi bi-journal-text me-2"></i>إدارة الامتحانات</h2>
        <router-link to="/teacher/exams/create" class="btn btn-primary-custom">
          <i class="bi bi-plus-circle me-2"></i>
          إنشاء امتحان جديد
        </router-link>
      </div>

      <div v-if="examsStore.exams.length === 0" class="section-card">
        <div class="card-body">
          <div class="empty-state">
            <i class="bi bi-journal-x"></i>
            <h4>لا توجد امتحانات</h4>
            <p>ابدأ بإنشاء امتحان جديد</p>
            <router-link
              to="/teacher/exams/create"
              class="btn btn-primary-custom"
            >
              <i class="bi bi-plus-circle me-2"></i>
              إنشاء امتحان
            </router-link>
          </div>
        </div>
      </div>

      <div v-else class="row">
        <div
          v-for="exam in examsStore.exams"
          :key="exam.firebaseKey || exam.id"
          class="col-md-6 col-lg-4 mb-4"
        >
          <div class="exam-card h-100">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="exam-title mb-0">{{ exam.title }}</h5>
              <span
                class="badge"
                :class="exam.isActive ? 'bg-success' : 'bg-secondary'"
              >
                {{ exam.isActive ? "مفعّل" : "معطّل" }}
              </span>
            </div>

            <p class="text-muted small mb-3">
              {{ exam.description || "بدون وصف" }}
            </p>

            <div class="exam-info">
              <span
                ><i class="bi bi-question-circle"></i>
                {{ exam.questions.length }} سؤال</span
              >
              <span><i class="bi bi-clock"></i> {{ exam.duration }} دقيقة</span>
            </div>

            <div class="exam-info mt-2">
              <span
                ><i class="bi bi-people"></i>
                {{ getExamResults(exam.firebaseKey || exam.id).length }}
                مشارك</span
              >
              <span
                ><i class="bi bi-calendar"></i>
                {{ formatDate(exam.createdAt) }}</span
              >
            </div>

            <hr />

            <div class="d-flex gap-2">
              <button
                class="btn btn-sm"
                :class="exam.isActive ? 'btn-warning' : 'btn-success'"
                @click="toggleExamStatus(exam.firebaseKey)"
              >
                <i :class="exam.isActive ? 'bi bi-pause' : 'bi bi-play'"></i>
                {{ exam.isActive ? "تعطيل" : "تفعيل" }}
              </button>
              <button
                class="btn btn-sm btn-outline-danger"
                @click="deleteExam(exam.firebaseKey)"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted } from "vue";
import { useExamsStore } from "@/store/examsStore";

export default {
  name: "ExamsPage",
  setup() {
    const examsStore = useExamsStore();

    // تحميل البيانات من Firebase عند تحميل الصفحة
    onMounted(async () => {
      await Promise.all([examsStore.loadExams(), examsStore.loadResults()]);
    });

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("ar-SA");
    };

    const getExamResults = (examId) => {
      return examsStore.getResultsByExam(examId);
    };

    const toggleExamStatus = async (firebaseKey) => {
      await examsStore.toggleExamStatus(firebaseKey);
    };

    const deleteExam = async (firebaseKey) => {
      if (confirm("هل أنت متأكد من حذف هذا الامتحان؟")) {
        await examsStore.deleteExam(firebaseKey);
      }
    };

    return {
      examsStore,
      formatDate,
      getExamResults,
      toggleExamStatus,
      deleteExam,
    };
  },
};
</script>
