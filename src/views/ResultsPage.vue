<template>
  <div class="dashboard-container py-4">
    <div class="container">
      <h2
        class="mb-4 page-title d-flex align-items-center justify-content-between"
      >
        <span> <i class="bi bi-bar-chart me-2"></i>نتائج الطلاب </span>
        <span class="realtime-indicator" title="تحديث تلقائي كل 3 ثواني">
          <i class="bi bi-broadcast me-1"></i>
          <small>تحديث مباشر</small>
        </span>
      </h2>

      <!-- فلتر حسب الامتحان -->
      <div class="section-card mb-4">
        <div class="card-body">
          <div class="row align-items-end gap-3">
            <div class="col-md-6">
              <label class="form-label">فلتر حسب الامتحان</label>
              <select class="form-select" v-model="selectedExam">
                <option value="">جميع الامتحانات</option>
                <option
                  v-for="exam in examsStore.exams"
                  :key="exam.id"
                  :value="exam.id"
                >
                  {{ exam.title }}
                </option>
              </select>
            </div>
            <div
              class="col-md-4"
              v-if="selectedExam && filteredResults.length > 0"
            >
              <button
                class="btn btn-outline-danger"
                @click="deleteAllExamResults"
                :disabled="isDeleting"
              >
                <i class="bi bi-trash me-2"></i>
                حذف جميع نتائج هذا الامتحان
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- جدول النتائج -->
      <div v-if="filteredResults.length === 0" class="section-card">
        <div class="card-body">
          <div class="empty-state">
            <i class="bi bi-clipboard-x"></i>
            <h4>لا توجد نتائج</h4>
            <p>لم يقدم أي طالب الامتحانات بعد</p>
          </div>
        </div>
      </div>

      <div v-else class="section-card">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-custom mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>اسم الطالب</th>
                  <th>البريد الإلكتروني</th>
                  <th>الامتحان</th>
                  <th>النتيجة</th>
                  <th>الإجابات الصحيحة</th>
                  <th>التاريخ</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(result, index) in filteredResults"
                  :key="result.id || result.firebaseKey"
                >
                  <td>{{ index + 1 }}</td>
                  <td>{{ result.studentName }}</td>
                  <td class="email-cell">{{ result.studentEmail }}</td>
                  <td>{{ result.examTitle }}</td>
                  <td>
                    <span
                      class="badge"
                      :class="getScoreBadgeClass(result.score)"
                    >
                      {{ result.score }}%
                    </span>
                  </td>
                  <td>
                    {{ result.correctAnswers }} / {{ result.totalQuestions }}
                  </td>
                  <td class="date-cell">
                    {{ formatDate(result.submittedAt) }}
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button
                        class="btn btn-outline-primary"
                        @click="resetExamForStudent(result)"
                        :disabled="isDeleting"
                        title="إعادة الامتحان للطالب"
                      >
                        <i class="bi bi-arrow-repeat"></i>
                      </button>
                      <button
                        class="btn btn-outline-danger"
                        @click="deleteResult(result)"
                        :disabled="isDeleting"
                        title="حذف النتيجة"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- إحصائيات -->
      <div v-if="filteredResults.length > 0" class="row mt-4">
        <div class="col-md-4 mb-3">
          <div class="stats-card">
            <div class="icon primary">
              <i class="bi bi-people"></i>
            </div>
            <h3>{{ filteredResults.length }}</h3>
            <p>إجمالي المشاركين</p>
          </div>
        </div>
        <div class="col-md-4 mb-3">
          <div class="stats-card">
            <div class="icon success">
              <i class="bi bi-graph-up"></i>
            </div>
            <h3>{{ averageScore }}%</h3>
            <p>متوسط النتائج</p>
          </div>
        </div>
        <div class="col-md-4 mb-3">
          <div class="stats-card">
            <div class="icon warning">
              <i class="bi bi-trophy"></i>
            </div>
            <h3>{{ highestScore }}%</h3>
            <p>أعلى نتيجة</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useExamsStore } from "@/store/examsStore";

// Firebase Realtime Database URL
const DATABASE_URL = "https://studyphysics-bd79d-default-rtdb.firebaseio.com/";

export default {
  name: "ResultsPage",
  setup() {
    const examsStore = useExamsStore();
    const selectedExam = ref("");
    const isDeleting = ref(false);
    const realtimeResults = ref({});
    const eventSources = ref({});
    const isLoadingRealtime = ref(false);

    // دالة لبدء الاستماع للتحديثات الفورية لامتحان معين
    const startRealtimeListener = (examId) => {
      // إذا كان هناك listener موجود لهذا الامتحان، لا نضيف آخر
      if (eventSources.value[examId]) {
        return;
      }

      // استخدام EventSource للاستماع للتحديثات الفورية من Firebase
      // const url = `${DATABASE_URL}results.json?orderBy="examId"&equalTo="${examId}"`;

      // بدء polling كل 3 ثواني للحصول على التحديثات الفورية
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`${DATABASE_URL}results.json`);
          if (response.ok) {
            const data = await response.json();
            if (data) {
              // تحويل البيانات وتحديث النتائج
              const allResults = Object.entries(data).map(([key, value]) => ({
                ...value,
                firebaseKey: key,
              }));

              // تحديث نتائج الامتحان المحدد
              realtimeResults.value[examId] = allResults.filter(
                (r) => r.examId === examId
              );

              // تحديث الـ store أيضاً
              examsStore.results = allResults;
            }
          }
        } catch (error) {
          console.error("Error fetching realtime results:", error);
        }
      }, 3000);

      eventSources.value[examId] = pollInterval;
    };

    // إيقاف الاستماع لامتحان معين
    const stopRealtimeListener = (examId) => {
      if (eventSources.value[examId]) {
        clearInterval(eventSources.value[examId]);
        delete eventSources.value[examId];
      }
    };

    // إيقاف جميع المستمعين
    const stopAllRealtimeListeners = () => {
      Object.keys(eventSources.value).forEach((examId) => {
        clearInterval(eventSources.value[examId]);
      });
      eventSources.value = {};
    };

    // مراقبة تغيير الامتحان المحدد لبدء/إيقاف الاستماع
    watch(selectedExam, (newExamId, oldExamId) => {
      // إيقاف الاستماع للامتحان القديم
      if (oldExamId) {
        stopRealtimeListener(oldExamId);
      }
      // بدء الاستماع للامتحان الجديد
      if (newExamId) {
        startRealtimeListener(newExamId);
      }
    });

    // تحميل البيانات من Firebase عند تحميل الصفحة
    onMounted(async () => {
      isLoadingRealtime.value = true;
      await Promise.all([examsStore.loadExams(), examsStore.loadResults()]);
      isLoadingRealtime.value = false;

      // بدء التحديث الفوري للكل إذا لم يكن هناك امتحان محدد
      if (!selectedExam.value) {
        // polling عام لجميع النتائج
        const globalPollInterval = setInterval(async () => {
          try {
            const response = await fetch(`${DATABASE_URL}results.json`);
            if (response.ok) {
              const data = await response.json();
              if (data) {
                const allResults = Object.entries(data).map(([key, value]) => ({
                  ...value,
                  firebaseKey: key,
                }));
                examsStore.results = allResults;
              }
            }
          } catch (error) {
            console.error("Error fetching realtime results:", error);
          }
        }, 3000);
        eventSources.value["global"] = globalPollInterval;
      }
    });

    // تنظيف المستمعين عند مغادرة الصفحة
    onUnmounted(() => {
      stopAllRealtimeListeners();
    });

    const filteredResults = computed(() => {
      if (!selectedExam.value) return examsStore.results;
      return examsStore.getResultsByExam(selectedExam.value);
    });

    const averageScore = computed(() => {
      if (filteredResults.value.length === 0) return 0;
      const sum = filteredResults.value.reduce((acc, r) => acc + r.score, 0);
      return Math.round(sum / filteredResults.value.length);
    });

    const highestScore = computed(() => {
      if (filteredResults.value.length === 0) return 0;
      return Math.max(...filteredResults.value.map((r) => r.score));
    });

    const getScoreBadgeClass = (score) => {
      if (score >= 90) return "bg-success";
      if (score >= 70) return "bg-primary";
      if (score >= 50) return "bg-warning";
      return "bg-danger";
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // حذف نتيجة واحدة
    const deleteResult = async (result) => {
      if (!confirm(`هل أنت متأكد من حذف نتيجة ${result.studentName}؟`)) return;

      isDeleting.value = true;
      try {
        await examsStore.deleteResult(result.firebaseKey);
      } catch (error) {
        alert("حدث خطأ أثناء حذف النتيجة");
      } finally {
        isDeleting.value = false;
      }
    };

    // إعادة الامتحان لطالب معين
    const resetExamForStudent = async (result) => {
      if (
        !confirm(
          `هل أنت ��تأكد من إعادة الامتحان للطالب ${result.studentName}؟\nسيتم حذف نتيجته الحالية وسيتمكن من إعادة الامتحان.`
        )
      )
        return;

      isDeleting.value = true;
      try {
        await examsStore.resetExamForStudent(
          result.examId,
          result.studentEmail
        );
        alert(`تم إعادة الامتحان للطالب ${result.studentName} بنجاح`);
      } catch (error) {
        alert("حدث خطأ أثناء إعادة الامتحان");
      } finally {
        isDeleting.value = false;
      }
    };

    // حذف جميع نتائج امتحان معين
    const deleteAllExamResults = async () => {
      const exam = examsStore.exams.find(
        (e) =>
          e.id === selectedExam.value || e.firebaseKey === selectedExam.value
      );
      const examTitle = exam?.title || "هذا الامتحان";

      if (
        !confirm(
          `هل أنت متأكد من حذف جميع نتائج "${examTitle}"؟ لا يمكن التراجع عن هذا الإجراء.`
        )
      )
        return;

      isDeleting.value = true;
      try {
        await examsStore.deleteResultsByExam(selectedExam.value);
        selectedExam.value = "";
      } catch (error) {
        alert("حدث خطأ أثناء حذف النتائج");
      } finally {
        isDeleting.value = false;
      }
    };

    return {
      examsStore,
      selectedExam,
      filteredResults,
      averageScore,
      highestScore,
      getScoreBadgeClass,
      formatDate,
      deleteResult,
      resetExamForStudent,
      deleteAllExamResults,
      isDeleting,
      isLoadingRealtime,
    };
  },
};
</script>

<style scoped>
.page-title {
  font-weight: 700;
}

.realtime-indicator {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  animation: pulse-realtime 2s infinite;
}

@keyframes pulse-realtime {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.email-cell {
  font-size: 0.85rem;
  color: var(--gray);
}

.date-cell {
  font-size: 0.85rem;
  white-space: nowrap;
}

.btn-outline-danger {
  transition: all 0.2s ease;
}

.btn-outline-danger:hover:not(:disabled) {
  transform: scale(1.05);
}

.btn-outline-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
