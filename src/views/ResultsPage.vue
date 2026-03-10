<template>
  <div class="dashboard-container py-4">
    <div class="container">
      <!-- Header -->
      <div
        class="page-header d-flex align-items-center justify-content-between mb-4"
      >
        <h2 class="page-title mb-0">
          <i class="bi bi-bar-chart me-2"></i>نتائج الطلاب
        </h2>
        <span class="realtime-indicator">
          <i class="bi bi-broadcast me-1"></i>
          <small>تحديث مباشر</small>
        </span>
      </div>

      <!-- Loading -->
      <div v-if="isLoadingRealtime" class="section-card mb-4">
        <div class="card-body text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-3 text-muted">جاري تحميل النتائج...</p>
        </div>
      </div>

      <!-- لا توجد امتحانات -->
      <div v-else-if="examsWithResults.length === 0" class="section-card">
        <div class="card-body">
          <div class="empty-state">
            <i class="bi bi-clipboard-x"></i>
            <h4>لا توجد نتائج</h4>
            <p>لم يقدم أي طالب الامتحانات بعد</p>
          </div>
        </div>
      </div>

      <!-- بطاقة لكل امتحان -->
      <div
        v-else
        v-for="examGroup in examsWithResults"
        :key="examGroup.examId"
        class="exam-results-card mb-4"
      >
        <!-- رأس البطاقة -->
        <div
          class="exam-card-header d-flex align-items-center justify-content-between flex-wrap gap-3"
        >
          <div class="d-flex align-items-center gap-3">
            <div class="exam-icon">
              <i class="bi bi-journal-text"></i>
            </div>
            <div>
              <h5 class="exam-title mb-0">{{ examGroup.examTitle }}</h5>
              <span class="participants-badge">
                <i class="bi bi-people me-1"></i>
                {{ examGroup.results.length }} طالب
              </span>
            </div>
          </div>

          <!-- إحصائيات + زر PDF -->
          <div class="d-flex align-items-center gap-3 flex-wrap">
            <div class="stat-pill">
              <span class="stat-label">متوسط</span>
              <span class="stat-value primary">{{ examGroup.avg }}%</span>
            </div>
            <div class="stat-pill">
              <span class="stat-label">أعلى</span>
              <span class="stat-value success">{{ examGroup.highest }}%</span>
            </div>
            <div class="stat-pill">
              <span class="stat-label">أدنى</span>
              <span class="stat-value danger">{{ examGroup.lowest }}%</span>
            </div>
            <button
              class="btn btn-excel"
              @click="downloadExamResultsPDF(examGroup)"
              :disabled="downloadingExamId === examGroup.examId"
            >
              <i class="bi bi-file-earmark-excel me-1"></i>
              {{
                downloadingExamId === examGroup.examId
                  ? "جاري..."
                  : "تحميل Excel"
              }}
            </button>
            <button
              class="btn btn-delete-exam"
              @click="
                deleteAllExamResults(examGroup.examId, examGroup.examTitle)
              "
              :disabled="deletingExamId === examGroup.examId"
            >
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <!-- جدول النتائج -->
        <div class="table-responsive">
          <table class="table table-custom mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>اسم الطالب</th>
                <th>البريد الإلكتروني</th>
                <th>النتيجة</th>
                <th>الإجابات الصحيحة</th>
                <th>التاريخ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(result, index) in examGroup.results"
                :key="result.firebaseKey || result.id"
              >
                <td>{{ index + 1 }}</td>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="student-avatar">
                      {{ result.studentName?.charAt(0) || "ط" }}
                    </div>
                    {{ result.studentName }}
                  </div>
                </td>
                <td class="email-cell">{{ result.studentEmail }}</td>
                <td>
                  <span
                    class="score-badge"
                    :class="getScoreBadgeClass(result.score)"
                  >
                    {{ result.score }}%
                  </span>
                </td>
                <td>
                  <span class="answers-cell">
                    {{ result.correctAnswers }} / {{ result.totalQuestions }}
                  </span>
                </td>
                <td class="date-cell">{{ formatDate(result.submittedAt) }}</td>
                <td>
                  <div class="d-flex gap-1">
                    <button
                      class="btn btn-icon btn-reset"
                      @click="resetExamForStudent(result)"
                      :disabled="deletingResultKey === result.firebaseKey"
                      title="إعادة الامتحان للطالب"
                    >
                      <i class="bi bi-arrow-repeat"></i>
                    </button>
                    <button
                      class="btn btn-icon btn-del"
                      @click="deleteResult(result)"
                      :disabled="deletingResultKey === result.firebaseKey"
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
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useExamsStore } from "@/store/examsStore";
import * as XLSX from "xlsx";

const DATABASE_URL = "https://studyphysics-bd79d-default-rtdb.firebaseio.com/";

export default {
  name: "ResultsPage",
  setup() {
    const examsStore = useExamsStore();
    const isLoadingRealtime = ref(false);
    const downloadingExamId = ref(null);
    const deletingExamId = ref(null);
    const deletingResultKey = ref(null);
    let pollInterval = null;

    // تحميل البيانات وبدء polling
    onMounted(async () => {
      isLoadingRealtime.value = true;
      await Promise.all([examsStore.loadExams(), examsStore.loadResults()]);
      isLoadingRealtime.value = false;

      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`${DATABASE_URL}results.json`);
          if (response.ok) {
            const data = await response.json();
            if (data) {
              examsStore.results = Object.entries(data).map(([key, value]) => ({
                ...value,
                firebaseKey: key,
              }));
            } else {
              examsStore.results = [];
            }
          }
        } catch (e) {
          // silent fail
        }
      }, 3000);
    });

    onUnmounted(() => {
      if (pollInterval) clearInterval(pollInterval);
    });

    // تجميع النتائج حسب كل امتحان
    const examsWithResults = computed(() => {
      const grouped = {};

      examsStore.results.forEach((result) => {
        const eid = result.examId;
        if (!grouped[eid]) {
          const exam = examsStore.exams.find(
            (e) => e.firebaseKey === eid || e.id === eid
          );
          grouped[eid] = {
            examId: eid,
            examTitle: result.examTitle || exam?.title || "امتحان غير معروف",
            results: [],
          };
        }
        grouped[eid].results.push(result);
      });

      // احسب إحصائيات لكل مجموعة
      return Object.values(grouped).map((g) => {
        const scores = g.results.map((r) => r.score);
        const avg = scores.length
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
        const highest = scores.length ? Math.max(...scores) : 0;
        const lowest = scores.length ? Math.min(...scores) : 0;
        return { ...g, avg, highest, lowest };
      });
    });

    const getScoreBadgeClass = (score) => {
      if (score >= 90) return "excellent";
      if (score >= 70) return "good";
      if (score >= 50) return "average";
      return "poor";
    };

    const formatDate = (date) =>
      new Date(date).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

    // حذف نتيجة واحدة
    const deleteResult = async (result) => {
      if (!confirm(`هل أنت متأكد من حذف نتيجة ${result.studentName}؟`)) return;
      deletingResultKey.value = result.firebaseKey;
      try {
        await examsStore.deleteResult(result.firebaseKey);
      } catch {
        alert("حدث خطأ أثناء حذف النتيجة");
      } finally {
        deletingResultKey.value = null;
      }
    };

    // إعادة الامتحان لطالب
    const resetExamForStudent = async (result) => {
      if (
        !confirm(
          `هل أنت متأكد من إعادة الامتحان للطالب ${result.studentName}؟\nسيتم حذف نتيجته الحالية.`
        )
      )
        return;
      deletingResultKey.value = result.firebaseKey;
      try {
        await examsStore.resetExamForStudent(
          result.examId,
          result.studentEmail
        );
      } catch {
        alert("حدث خطأ أثناء إعادة الامتحان");
      } finally {
        deletingResultKey.value = null;
      }
    };

    // حذف جميع نتائج امتحان
    const deleteAllExamResults = async (examId, examTitle) => {
      if (
        !confirm(
          `هل أنت متأكد من حذف جميع نتائج "${examTitle}"؟ لا يمكن التراجع.`
        )
      )
        return;
      deletingExamId.value = examId;
      try {
        await examsStore.deleteResultsByExam(examId);
      } catch {
        alert("حدث خطأ أثناء حذف النتائج");
      } finally {
        deletingExamId.value = null;
      }
    };

    // تحميل Excel لامتحان معين
    const downloadExamResultsPDF = (examGroup) => {
      downloadingExamId.value = examGroup.examId;

      try {
        // بناء بيانات الجدول
        const header = [
          [
            "#",
            "اسم الطالب",
            "البريد الإلكتروني",
            "النتيجة (%)",
            "الإجابات الصحيحة",
            "إجمالي الأسئلة",
            "التاريخ",
          ],
        ];

        const rows = examGroup.results.map((r, i) => [
          i + 1,
          r.studentName || "",
          r.studentEmail || "",
          r.score,
          r.correctAnswers,
          r.totalQuestions,
          formatDate(r.submittedAt),
        ]);

        // صف الإحصائيات
        const statsRows = [
          [],
          ["إحصائيات الامتحان"],
          ["عدد المشاركين", examGroup.results.length],
          ["المتوسط", `${examGroup.avg}%`],
          ["أعلى نتيجة", `${examGroup.highest}%`],
          ["أدنى نتيجة", `${examGroup.lowest}%`],
        ];

        const allData = [
          [`نتائج امتحان: ${examGroup.examTitle}`],
          [`تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")}`],
          [],
          ...header,
          ...rows,
          ...statsRows,
        ];

        // إنشاء ورقة العمل
        const ws = XLSX.utils.aoa_to_sheet(allData);

        // ضبط عرض الأعمدة
        ws["!cols"] = [
          { wch: 5 },
          { wch: 25 },
          { wch: 30 },
          { wch: 12 },
          { wch: 18 },
          { wch: 16 },
          { wch: 22 },
        ];

        // إنشاء الكتاب
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "النتائج");

        // تحميل الملف
        const fileName = `نتائج_${examGroup.examTitle.replace(
          /\s+/g,
          "_"
        )}_${new Date().toLocaleDateString("ar-SA").replace(/\//g, "-")}.xlsx`;
        XLSX.writeFile(wb, fileName);
      } catch (e) {
        alert("حدث خطأ أثناء إنشاء ملف Excel");
      } finally {
        downloadingExamId.value = null;
      }
    };

    return {
      examsStore,
      isLoadingRealtime,
      downloadingExamId,
      deletingExamId,
      deletingResultKey,
      examsWithResults,
      getScoreBadgeClass,
      formatDate,
      deleteResult,
      resetExamForStudent,
      deleteAllExamResults,
      downloadExamResultsPDF,
    };
  },
};
</script>

<style scoped>
.page-title {
  font-size: 1.6rem;
  font-weight: 700;
}

.realtime-indicator {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  padding: 0.4rem 0.9rem;
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

/* بطاقة الامتحان */
.exam-results-card {
  background: var(--white, #fff);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
  border: 1px solid var(--border, #e9ecef);
}

.exam-card-header {
  padding: 1.25rem 1.5rem;
  background: var(--white, #fff);
  border-bottom: 1px solid var(--border, #e9ecef);
}

.exam-icon {
  width: 44px;
  height: 44px;
  background: #eff6ff;
  color: #3b82f6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.exam-title {
  font-weight: 700;
  font-size: 1rem;
  color: var(--dark, #1a1a2e);
}

.participants-badge {
  font-size: 0.78rem;
  color: var(--gray, #6c757d);
  margin-top: 2px;
  display: inline-block;
}

/* إحصائيات صغيرة */
.stat-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 6px 14px;
  min-width: 62px;
}

.stat-label {
  font-size: 0.68rem;
  color: #94a3b8;
  font-weight: 500;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat-value.primary {
  color: #3b82f6;
}
.stat-value.success {
  color: #10b981;
}
.stat-value.danger {
  color: #ef4444;
}

/* أزرار */
.btn-excel {
  background: #217346;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.45rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background 0.2s;
}

.btn-excel:hover:not(:disabled) {
  background: #185c37;
  color: #fff;
}
.btn-excel:disabled {
  opacity: 0.6;
}

.btn-delete-exam {
  background: transparent;
  color: #ef4444;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-delete-exam:hover:not(:disabled) {
  background: #ef4444;
  color: #fff;
}

/* جدول */
.table-custom {
  width: 100%;
}

.table-custom thead th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
  font-size: 0.82rem;
  padding: 0.85rem 1rem;
  border-bottom: 2px solid #e2e8f0;
  text-align: right;
}

.table-custom tbody td {
  padding: 0.9rem 1rem;
  vertical-align: middle;
  color: var(--dark, #1a1a2e);
  font-size: 0.9rem;
  border-bottom: 1px solid #f1f5f9;
}

.table-custom tbody tr:last-child td {
  border-bottom: none;
}

.table-custom tbody tr:hover td {
  background: #f8fafc;
}

/* أفاتار الطالب */
.student-avatar {
  width: 32px;
  height: 32px;
  background: #eff6ff;
  color: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8rem;
  flex-shrink: 0;
}

/* بادج النتيجة */
.score-badge {
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.85rem;
}

.score-badge.excellent {
  background: #d1fae5;
  color: #065f46;
}
.score-badge.good {
  background: #dbeafe;
  color: #1e40af;
}
.score-badge.average {
  background: #fef3c7;
  color: #92400e;
}
.score-badge.poor {
  background: #fee2e2;
  color: #991b1b;
}

.answers-cell {
  font-weight: 600;
  color: #475569;
}

.email-cell {
  font-size: 0.83rem;
  color: #64748b;
  direction: ltr;
  text-align: right;
}

.date-cell {
  font-size: 0.82rem;
  color: #64748b;
  white-space: nowrap;
}

/* أزرار الإجراءات */
.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  border: 1px solid;
  transition: all 0.2s;
  padding: 0;
}

.btn-reset {
  color: #3b82f6;
  border-color: #bfdbfe;
  background: transparent;
}

.btn-reset:hover:not(:disabled) {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.btn-del {
  color: #ef4444;
  border-color: #fecaca;
  background: transparent;
}

.btn-del:hover:not(:disabled) {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
}

.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* empty state */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}
</style>
