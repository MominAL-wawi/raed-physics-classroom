<template>
  <div class="dashboard-container">
    <div class="container">
      <h2 class="mb-4"><i class="bi bi-bar-chart me-2"></i>نتائجي</h2>

      <div v-if="myResults.length === 0" class="section-card">
        <div class="card-body">
          <div class="empty-state">
            <i class="bi bi-clipboard-x"></i>
            <h4>لا توجد نتائج</h4>
            <p>لم تقدم أي امتحان بعد</p>
            <router-link to="/student" class="btn btn-primary-custom">
              عرض الامتحانات المتاحة
            </router-link>
          </div>
        </div>
      </div>

      <div v-else>
        <!-- ملخص الأداء -->
        <div class="row mb-4">
          <div class="col-md-4 mb-3">
            <div class="stats-card">
              <div class="icon primary">
                <i class="bi bi-journal-check"></i>
              </div>
              <h3>{{ myResults.length }}</h3>
              <p>الامتحانات المكتملة</p>
            </div>
          </div>
          <div class="col-md-4 mb-3">
            <div class="stats-card">
              <div class="icon success">
                <i class="bi bi-graph-up"></i>
              </div>
              <h3>{{ averageScore }}%</h3>
              <p>متوسط نتائجي</p>
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

        <!-- قائمة النتائج -->
        <div class="row">
          <div
            v-for="result in myResults"
            :key="result.id"
            class="col-md-6 mb-4"
          >
            <div class="result-item section-card h-100">
              <div class="card-body">
                <div
                  class="d-flex justify-content-between align-items-start mb-3"
                >
                  <div>
                    <h5 class="mb-1">{{ result.examTitle }}</h5>
                    <small class="text-muted">{{
                      formatDate(result.submittedAt)
                    }}</small>
                  </div>
                  <div
                    class="result-badge"
                    :class="getResultClass(result.score)"
                  >
                    {{ result.score }}%
                  </div>
                </div>

                <div class="progress-custom mb-3">
                  <div
                    class="progress-bar"
                    :class="getProgressClass(result.score)"
                    :style="{ width: result.score + '%' }"
                  ></div>
                </div>

                <div class="d-flex justify-content-between text-muted small">
                  <span
                    ><i class="bi bi-check-circle text-success me-1"></i
                    >{{ result.correctAnswers }} إجابة صحيحة</span
                  >
                  <span
                    ><i class="bi bi-question-circle me-1"></i
                    >{{ result.totalQuestions }} سؤال</span
                  >
                </div>

                <div
                  class="mt-3 pt-3 border-top d-flex justify-content-between align-items-center"
                >
                  <span
                    class="badge"
                    :class="getPerformanceBadge(result.score)"
                  >
                    {{ getPerformanceText(result.score) }}
                  </span>
                  <router-link
                    :to="`/student/results/review/${
                      result.firebaseKey || result.id
                    }`"
                    class="btn-review"
                  >
                    <i class="bi bi-eye me-1"></i>
                    مراجعة الإجابات
                  </router-link>
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
import { useExamsStore } from "@/store/examsStore";

export default {
  name: "StudentResultsPage",
  setup() {
    const authStore = useAuthStore();
    const examsStore = useExamsStore();

    // تحميل البيانات من Firebase عند تحميل الصفحة
    onMounted(async () => {
      await examsStore.loadResults();
    });

    const myResults = computed(() => {
      return examsStore.getResultsByStudent(authStore.user?.email).reverse();
    });

    const averageScore = computed(() => {
      if (myResults.value.length === 0) return 0;
      const sum = myResults.value.reduce((acc, r) => acc + r.score, 0);
      return Math.round(sum / myResults.value.length);
    });

    const highestScore = computed(() => {
      if (myResults.value.length === 0) return 0;
      return Math.max(...myResults.value.map((r) => r.score));
    });

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const getResultClass = (score) => {
      if (score >= 90) return "excellent";
      if (score >= 70) return "good";
      if (score >= 50) return "average";
      return "poor";
    };

    const getProgressClass = (score) => {
      if (score >= 90) return "bg-success";
      if (score >= 70) return "bg-primary";
      if (score >= 50) return "bg-warning";
      return "bg-danger";
    };

    const getPerformanceBadge = (score) => {
      if (score >= 90) return "bg-success";
      if (score >= 70) return "bg-primary";
      if (score >= 50) return "bg-warning";
      return "bg-danger";
    };

    const getPerformanceText = (score) => {
      if (score >= 90) return "ممتاز";
      if (score >= 70) return "جيد جداً";
      if (score >= 50) return "جيد";
      return "يحتاج تحسين";
    };

    return {
      myResults,
      averageScore,
      highestScore,
      formatDate,
      getResultClass,
      getProgressClass,
      getPerformanceBadge,
      getPerformanceText,
    };
  },
};
</script>

<style scoped>
.btn-review {
  display: inline-flex;
  align-items: center;
  background: rgba(67, 97, 238, 0.1);
  color: #4361ee;
  text-decoration: none;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.2s ease;
  border: 1px solid rgba(67, 97, 238, 0.2);
}

.btn-review:hover {
  background: #4361ee;
  color: white;
}

.result-badge {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: white;
}

.result-badge.excellent {
  background: linear-gradient(135deg, #06d6a0 0%, #00b894 100%);
}

.result-badge.good {
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
}

.result-badge.average {
  background: linear-gradient(135deg, #ffd166 0%, #fdcb6e 100%);
  color: #333;
}

.result-badge.poor {
  background: linear-gradient(135deg, #ef476f 0%, #d63031 100%);
}
</style>
