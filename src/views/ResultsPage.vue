<template>
  <div class="dashboard-container">
    <div class="container">
      <h2 class="mb-4"><i class="bi bi-bar-chart me-2"></i>نتائج الطلاب</h2>

      <!-- فلتر حسب الامتحان -->
      <div class="section-card mb-4">
        <div class="card-body">
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
                </tr>
              </thead>
              <tbody>
                <tr v-for="(result, index) in filteredResults" :key="result.id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ result.studentName }}</td>
                  <td>{{ result.studentEmail }}</td>
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
                  <td>{{ formatDate(result.submittedAt) }}</td>
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
import { ref, computed, onMounted } from "vue";
import { useExamsStore } from "@/store/examsStore";

export default {
  name: "ResultsPage",
  setup() {
    const examsStore = useExamsStore();
    const selectedExam = ref("");

    // تحميل البيانات من Firebase عند تحميل الصفحة
    onMounted(async () => {
      await Promise.all([examsStore.loadExams(), examsStore.loadResults()]);
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

    return {
      examsStore,
      selectedExam,
      filteredResults,
      averageScore,
      highestScore,
      getScoreBadgeClass,
      formatDate,
    };
  },
};
</script>
