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

            <!-- حالة المراجعة -->
            <div class="exam-review-status mt-2">
              <span
                class="badge"
                :class="exam.allowReview ? 'bg-info' : 'bg-secondary'"
              >
                <i
                  :class="exam.allowReview ? 'bi bi-eye' : 'bi bi-eye-slash'"
                ></i>
                {{ exam.allowReview ? "المراجعة مفعّلة" : "المراجعة معطّلة" }}
              </span>
              <span
                v-if="exam.selectedStudents && exam.selectedStudents.length > 0"
                class="badge bg-warning ms-1"
              >
                <i class="bi bi-people"></i>
                {{ exam.selectedStudents.length }} طالب محدد
              </span>
              <span v-if="exam.ignoreDeadline" class="badge bg-success ms-1">
                <i class="bi bi-unlock"></i>
                مفتوح للجميع
              </span>
              <span
                v-if="
                  exam.allowedAfterDeadline &&
                  exam.allowedAfterDeadline.length > 0
                "
                class="badge bg-info ms-1"
                :title="
                  'الطلاب المسموح لهم: ' + exam.allowedAfterDeadline.join(', ')
                "
              >
                <i class="bi bi-person-check"></i>
                {{ exam.allowedAfterDeadline.length }} استثناء
              </span>
            </div>

            <!-- حالة الوقت -->
            <div v-if="exam.endDateTime" class="exam-time-status mt-2">
              <span class="badge" :class="getExamTimeStatusClass(exam)">
                <i :class="getExamTimeStatusIcon(exam)"></i>
                {{ getExamTimeStatusText(exam) }}
              </span>
            </div>

            <hr />

            <div class="d-flex gap-2 flex-wrap">
              <button
                class="btn btn-sm"
                :class="exam.isActive ? 'btn-warning' : 'btn-success'"
                @click="toggleExamStatus(exam.firebaseKey)"
              >
                <i :class="exam.isActive ? 'bi bi-pause' : 'bi bi-play'"></i>
                {{ exam.isActive ? "تعطيل" : "تفعيل" }}
              </button>
              <button
                class="btn btn-sm"
                :class="exam.allowReview ? 'btn-secondary' : 'btn-info'"
                @click="toggleReviewVisibility(exam.firebaseKey)"
              >
                <i
                  :class="exam.allowReview ? 'bi bi-eye-slash' : 'bi bi-eye'"
                ></i>
                {{ exam.allowReview ? "إخفاء المراجعة" : "إظهار المراجعة" }}
              </button>
              <!-- زر فتح الاختبار للجميع -->
              <button
                v-if="isExamEnded(exam) && !exam.ignoreDeadline"
                class="btn btn-sm btn-outline-success"
                @click="openExamForAll(exam.firebaseKey)"
                title="فتح الاختبار للجميع بعد انتهاء الوقت"
              >
                <i class="bi bi-unlock"></i>
                فتح للجميع
              </button>
              <!-- زر إغلاق الاختبار -->
              <button
                v-if="exam.ignoreDeadline"
                class="btn btn-sm btn-outline-warning"
                @click="showCloseExamModal(exam)"
                title="إغلاق الاختبار وتحديد موعد جديد"
              >
                <i class="bi bi-lock"></i>
                إغلاق
              </button>
              <!-- زر إدارة الطلاب المسموح لهم -->
              <button
                v-if="isExamEnded(exam)"
                class="btn btn-sm btn-outline-primary"
                @click="showStudentAccessModal(exam)"
                title="فتح الاختبار لطلاب معينين"
              >
                <i class="bi bi-person-plus"></i>
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

    <!-- Modal فتح الاختبار لطلاب معينين -->
    <div class="modal fade" id="studentAccessModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-person-plus me-2"></i>
              فتح الاختبار لطلاب معينين
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
            ></button>
          </div>
          <div class="modal-body">
            <p class="text-muted mb-3">
              اختر الطلاب الذين تريد السماح لهم بتقديم الاختبار بعد انتهاء
              الموعد:
            </p>

            <!-- البحث -->
            <input
              type="text"
              class="form-control mb-3"
              v-model="studentSearchQuery"
              placeholder="بحث عن طالب..."
            />

            <!-- قائمة الطلاب -->
            <div
              class="students-list"
              style="max-height: 300px; overflow-y: auto"
            >
              <div
                v-for="student in filteredStudentsForAccess"
                :key="student.firebaseKey"
                class="form-check p-2 border-bottom"
              >
                <input
                  class="form-check-input"
                  type="checkbox"
                  :id="'access-' + student.firebaseKey"
                  :value="student.email"
                  v-model="selectedStudentsForAccess"
                />
                <label
                  class="form-check-label"
                  :for="'access-' + student.firebaseKey"
                >
                  {{ student.name }}
                  <small class="text-muted d-block">{{ student.email }}</small>
                  <span
                    v-if="isStudentAlreadyAllowed(student.email)"
                    class="badge bg-success"
                  >
                    مسموح له حالياً
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              إلغاء
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="saveStudentAccess"
              :disabled="isSaving"
            >
              <span
                v-if="isSaving"
                class="spinner-border spinner-border-sm me-2"
              ></span>
              حفظ التغييرات
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal إغلاق الاختبار -->
    <div class="modal fade" id="closeExamModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-lock me-2"></i>
              إغلاق الاختبار
            </h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
            ></button>
          </div>
          <div class="modal-body">
            <p class="text-muted mb-3">حدد الموعد النهائي الجديد للاختبار:</p>
            <div class="mb-3">
              <label class="form-label">تاريخ ووقت الانتهاء الجديد</label>
              <input
                type="datetime-local"
                class="form-control"
                v-model="newEndDateTime"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              إلغاء
            </button>
            <button
              type="button"
              class="btn btn-warning"
              @click="closeExamDeadline"
              :disabled="isSaving"
            >
              <span
                v-if="isSaving"
                class="spinner-border spinner-border-sm me-2"
              ></span>
              إغلاق الاختبار
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useExamsStore } from "@/store/examsStore";
import { useAuthStore } from "@/store/authStore";
import * as bootstrap from "bootstrap";

export default {
  name: "ExamsPage",
  setup() {
    const examsStore = useExamsStore();
    const authStore = useAuthStore();

    // متغيرات للـ modals
    const selectedExam = ref(null);
    const studentSearchQuery = ref("");
    const selectedStudentsForAccess = ref([]);
    const newEndDateTime = ref("");
    const isSaving = ref(false);

    // تحميل البيانات من Firebase عند تحميل الصفحة
    onMounted(async () => {
      await Promise.all([
        examsStore.loadExams(),
        examsStore.loadResults(),
        authStore.loadStudents(),
      ]);
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

    const toggleReviewVisibility = async (firebaseKey) => {
      await examsStore.toggleReviewVisibility(firebaseKey);
    };

    const deleteExam = async (firebaseKey) => {
      if (confirm("هل أنت متأكد من حذف هذا الامتحان؟")) {
        await examsStore.deleteExam(firebaseKey);
      }
    };

    // التحقق من حالة الوقت
    const isExamEnded = (exam) => {
      if (!exam.endDateTime) return false;
      return new Date() > new Date(exam.endDateTime);
    };

    const getExamTimeStatusClass = (exam) => {
      if (exam.ignoreDeadline) return "bg-success";
      const status = examsStore.getExamTimeStatus(exam);
      switch (status) {
        case "upcoming":
          return "bg-info";
        case "open":
          return "bg-success";
        case "ended":
          return "bg-danger";
        default:
          return "bg-secondary";
      }
    };

    const getExamTimeStatusIcon = (exam) => {
      if (exam.ignoreDeadline) return "bi bi-unlock";
      const status = examsStore.getExamTimeStatus(exam);
      switch (status) {
        case "upcoming":
          return "bi bi-clock";
        case "open":
          return "bi bi-check-circle";
        case "ended":
          return "bi bi-x-circle";
        default:
          return "bi bi-question-circle";
      }
    };

    const getExamTimeStatusText = (exam) => {
      if (exam.ignoreDeadline) return "مفتوح للجميع";
      const status = examsStore.getExamTimeStatus(exam);
      switch (status) {
        case "upcoming":
          return "لم يبدأ بعد";
        case "open":
          return "متاح الآن";
        case "ended":
          return "انتهى الموعد";
        default:
          return "غير محدد";
      }
    };

    // فتح الاختبار للجميع
    const openExamForAll = async (firebaseKey) => {
      if (confirm("هل تريد فتح الاختبار للجميع بعد انتهاء الموعد؟")) {
        await examsStore.openExamForAll(firebaseKey);
      }
    };

    // عرض modal إدارة وصول الطلاب
    const showStudentAccessModal = (exam) => {
      selectedExam.value = exam;
      selectedStudentsForAccess.value = exam.allowedAfterDeadline || [];
      studentSearchQuery.value = "";
      const modal = new bootstrap.Modal(
        document.getElementById("studentAccessModal")
      );
      modal.show();
    };

    // عرض modal إغلاق الاختبار
    const showCloseExamModal = (exam) => {
      selectedExam.value = exam;
      newEndDateTime.value = "";
      const modal = new bootstrap.Modal(
        document.getElementById("closeExamModal")
      );
      modal.show();
    };

    // قائمة الطلاب المفلترة
    const filteredStudentsForAccess = computed(() => {
      if (!studentSearchQuery.value) return authStore.students;
      const query = studentSearchQuery.value.toLowerCase();
      return authStore.students.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query)
      );
    });

    // التحقق إذا كان الطالب مسموحاً له
    const isStudentAlreadyAllowed = (email) => {
      if (!selectedExam.value) return false;
      const allowed = selectedExam.value.allowedAfterDeadline || [];
      return allowed.includes(email);
    };

    // حفظ صلاحيات الطلاب
    const saveStudentAccess = async () => {
      if (!selectedExam.value) return;
      isSaving.value = true;
      try {
        await examsStore.updateExam(selectedExam.value.firebaseKey, {
          allowedAfterDeadline: selectedStudentsForAccess.value,
        });
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("studentAccessModal")
        );
        modal.hide();
      } catch (error) {
        console.error("Error saving student access:", error);
        alert("حدث خطأ أثناء حفظ التغييرات");
      } finally {
        isSaving.value = false;
      }
    };

    // إغلاق الاختبار
    const closeExamDeadline = async () => {
      if (!selectedExam.value || !newEndDateTime.value) {
        alert("يرجى تحديد الموعد النهائي الجديد");
        return;
      }
      isSaving.value = true;
      try {
        await examsStore.closeExamDeadline(
          selectedExam.value.firebaseKey,
          newEndDateTime.value
        );
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("closeExamModal")
        );
        modal.hide();
      } catch (error) {
        console.error("Error closing exam:", error);
        alert("حدث خطأ أثناء إغلاق الاختبار");
      } finally {
        isSaving.value = false;
      }
    };

    return {
      examsStore,
      formatDate,
      getExamResults,
      toggleExamStatus,
      toggleReviewVisibility,
      deleteExam,
      isExamEnded,
      getExamTimeStatusClass,
      getExamTimeStatusIcon,
      getExamTimeStatusText,
      openExamForAll,
      showStudentAccessModal,
      showCloseExamModal,
      studentSearchQuery,
      selectedStudentsForAccess,
      filteredStudentsForAccess,
      isStudentAlreadyAllowed,
      saveStudentAccess,
      newEndDateTime,
      closeExamDeadline,
      isSaving,
    };
  },
};
</script>
