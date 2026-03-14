<template>
  <div class="dashboard-container">
    <div class="container">
      <div class="d-flex align-items-center mb-4">
        <router-link to="/teacher/exams" class="btn btn-outline-primary me-3">
          <i class="bi bi-arrow-right"></i>
        </router-link>
        <h2 class="mb-0">
          <i class="bi bi-pencil-square me-2"></i>تعديل الامتحان
        </h2>
      </div>

      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">جاري التحميل...</span>
        </div>
      </div>

      <form v-else @submit.prevent="updateExam">
        <div class="row">
          <div class="col-lg-8">
            <!-- معلومات الامتحان -->
            <div class="section-card mb-4">
              <div class="card-header">
                <h5 class="mb-0">معلومات الامتحان</h5>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label">عنوان الامتحان</label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="form.title"
                    required
                    placeholder="مثال: امتحان الفصل الأول"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">وصف الامتحان (اختياري)</label>
                  <textarea
                    class="form-control"
                    v-model="form.description"
                    rows="2"
                    placeholder="وصف مختصر للامتحان..."
                  ></textarea>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">مدة الامتحان (بالدقائق)</label>
                    <input
                      type="number"
                      class="form-control"
                      v-model="form.duration"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <!-- نافذة الوقت المسموح بها -->
                <div class="time-window-card">
                  <div class="time-window-header">
                    <i class="bi bi-calendar-event me-2"></i>
                    نافذة الوقت المسموح بتقديم الامتحان
                  </div>
                  <div class="time-window-body">
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label class="form-label">
                          <i class="bi bi-play-circle text-success me-1"></i>
                          تاريخ ووقت البداية
                        </label>
                        <input
                          type="datetime-local"
                          class="form-control"
                          v-model="form.startDateTime"
                        />
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">
                          <i class="bi bi-stop-circle text-danger me-1"></i>
                          تاريخ ووقت الانتهاء
                        </label>
                        <input
                          type="datetime-local"
                          class="form-control"
                          v-model="form.endDateTime"
                        />
                      </div>
                    </div>
                    <div class="time-window-note mt-2">
                      <i class="bi bi-info-circle me-1"></i>
                      اتركهما فارغين للسماح بالتقديم في أي وقت
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- أسئلة الامتحان الحالية -->
            <div class="section-card mb-4">
              <div
                class="card-header d-flex justify-content-between align-items-center"
              >
                <h5 class="mb-0">
                  <i class="bi bi-list-check me-2"></i>أسئلة الامتحان الحالية
                </h5>
                <span class="badge bg-primary">
                  {{ examQuestions.length }} سؤال
                </span>
              </div>
              <div class="card-body">
                <div v-if="examQuestions.length === 0" class="empty-state py-3">
                  <i class="bi bi-question-circle" style="font-size: 40px"></i>
                  <p class="mb-0">لا توجد أسئلة في الامتحان</p>
                </div>

                <div v-else class="exam-questions-list">
                  <div
                    v-for="(question, index) in examQuestions"
                    :key="question.firebaseKey || question.id || index"
                    class="exam-question-item"
                  >
                    <div class="question-content">
                      <div
                        class="d-flex justify-content-between align-items-start"
                      >
                        <div class="question-number">{{ index + 1 }}</div>
                        <div class="flex-grow-1 ms-3">
                          <div class="question-text">{{ question.text }}</div>
                          <div class="d-flex gap-2 mt-2">
                            <span
                              class="badge"
                              :class="
                                question.type === 'multiple'
                                  ? 'bg-primary'
                                  : 'bg-success'
                              "
                            >
                              {{
                                question.type === "multiple"
                                  ? "اختيار من متعدد"
                                  : "صح/خطأ"
                              }}
                            </span>
                          </div>
                        </div>
                        <div class="question-actions">
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            @click="removeQuestion(index)"
                            title="حذف السؤال"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- إضافة أسئلة جديدة -->
            <div class="section-card">
              <div
                class="card-header d-flex justify-content-between align-items-center"
              >
                <h5 class="mb-0">
                  <i class="bi bi-plus-circle me-2"></i>إضافة أسئلة جديدة
                </h5>
                <span class="badge bg-light text-dark">
                  {{ selectedNewQuestions.length }} سؤال محدد للإضافة
                </span>
              </div>
              <div class="card-body">
                <div
                  v-if="availableQuestions.length === 0"
                  class="empty-state py-4"
                >
                  <i class="bi bi-check-circle" style="font-size: 40px"></i>
                  <p class="mb-2">جميع الأسئلة المتاحة مضافة بالفعل</p>
                  <router-link
                    to="/teacher/questions"
                    class="btn btn-primary-custom btn-sm"
                  >
                    إضافة أسئلة جديدة للبنك
                  </router-link>
                </div>

                <div v-else>
                  <!-- فلتر سريع -->
                  <div class="btn-group mb-3">
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="
                        questionFilter === 'all'
                          ? 'btn-primary'
                          : 'btn-outline-primary'
                      "
                      @click="questionFilter = 'all'"
                    >
                      الكل
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="
                        questionFilter === 'multiple'
                          ? 'btn-primary'
                          : 'btn-outline-primary'
                      "
                      @click="questionFilter = 'multiple'"
                    >
                      اختيار من متعدد
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="
                        questionFilter === 'truefalse'
                          ? 'btn-primary'
                          : 'btn-outline-primary'
                      "
                      @click="questionFilter = 'truefalse'"
                    >
                      صح/خطأ
                    </button>
                  </div>

                  <div
                    class="questions-list"
                    style="max-height: 300px; overflow-y: auto"
                  >
                    <div
                      v-for="question in filteredAvailableQuestions"
                      :key="question.firebaseKey || question.id"
                      class="form-check question-select-item p-3 mb-2 rounded"
                      :class="{
                        selected: isNewQuestionSelected(
                          question.firebaseKey || question.id
                        ),
                      }"
                    >
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :id="'new-q-' + (question.firebaseKey || question.id)"
                        :value="question.firebaseKey || question.id"
                        v-model="selectedNewQuestions"
                      />
                      <label
                        class="form-check-label w-100"
                        :for="'new-q-' + (question.firebaseKey || question.id)"
                      >
                        <div class="d-flex justify-content-between">
                          <span>{{ question.text }}</span>
                          <span
                            class="badge"
                            :class="
                              question.type === 'multiple'
                                ? 'bg-primary'
                                : 'bg-success'
                            "
                          >
                            {{
                              question.type === "multiple" ? "متعدد" : "صح/خطأ"
                            }}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="btn btn-success mt-3"
                    @click="addSelectedQuestions"
                    :disabled="selectedNewQuestions.length === 0"
                  >
                    <i class="bi bi-plus-lg me-2"></i>
                    إضافة الأسئلة المحددة ({{ selectedNewQuestions.length }})
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-4">
            <!-- ملخص الامتحان -->
            <div class="section-card sticky-top" style="top: 20px">
              <div class="card-header">
                <h5 class="mb-0">ملخص الامتحان</h5>
              </div>
              <div class="card-body">
                <ul class="list-unstyled mb-4">
                  <li class="d-flex justify-content-between py-2 border-bottom">
                    <span>عدد الأسئلة:</span>
                    <strong>{{ examQuestions.length }}</strong>
                  </li>
                  <li class="d-flex justify-content-between py-2 border-bottom">
                    <span>المدة:</span>
                    <strong>{{ form.duration }} دقيقة</strong>
                  </li>
                  <li class="d-flex justify-content-between py-2">
                    <span>اختيار من متعدد:</span>
                    <strong>{{ multipleCount }}</strong>
                  </li>
                  <li class="d-flex justify-content-between py-2">
                    <span>صح/خطأ:</span>
                    <strong>{{ trueFalseCount }}</strong>
                  </li>
                </ul>

                <!-- تحذير إذا كان هناك طلاب قدموا -->
                <div
                  v-if="submissionsCount > 0"
                  class="alert alert-warning mb-3"
                >
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  <strong>تنبيه:</strong> هناك {{ submissionsCount }} طالب قدموا
                  هذا الامتحان. تعديل الأسئلة لن يؤثر على نتائجهم السابقة.
                </div>

                <div class="d-grid gap-2">
                  <button
                    type="submit"
                    class="btn btn-primary-custom btn-lg"
                    :disabled="examQuestions.length === 0 || isSaving"
                  >
                    <span
                      v-if="isSaving"
                      class="spinner-border spinner-border-sm me-2"
                    ></span>
                    <i v-else class="bi bi-check-lg me-2"></i>
                    {{ isSaving ? "جاري الحفظ..." : "حفظ التعديلات" }}
                  </button>
                  <router-link
                    to="/teacher/exams"
                    class="btn btn-outline-secondary"
                  >
                    إلغاء
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useQuestionsStore } from "@/store/questionsStore";
import { useExamsStore } from "@/store/examsStore";

export default {
  name: "EditExamPage",
  setup() {
    const router = useRouter();
    const route = useRoute();
    const questionsStore = useQuestionsStore();
    const examsStore = useExamsStore();

    const isLoading = ref(true);
    const isSaving = ref(false);
    const examQuestions = ref([]);
    const selectedNewQuestions = ref([]);
    const questionFilter = ref("all");

    const form = ref({
      title: "",
      description: "",
      duration: 30,
      startDateTime: "",
      endDateTime: "",
    });

    const examId = computed(() => route.params.id);

    // تحميل بيانات الامتحان
    onMounted(async () => {
      isLoading.value = true;
      try {
        await Promise.all([
          questionsStore.loadQuestions(),
          examsStore.loadExams(),
          examsStore.loadResults(),
        ]);

        const exam = examsStore.getExamById(examId.value);
        if (exam) {
          form.value.title = exam.title;
          form.value.description = exam.description || "";
          form.value.duration = exam.duration;
          form.value.startDateTime = exam.startDateTime || "";
          form.value.endDateTime = exam.endDateTime || "";
          examQuestions.value = [...(exam.questions || [])];
        } else {
          alert("الامتحان غير موجود");
          router.push("/teacher/exams");
        }
      } catch (error) {
        console.error("Error loading exam:", error);
        alert("حدث خطأ أثناء تحميل الامتحان");
      } finally {
        isLoading.value = false;
      }
    });

    // الأسئلة المتاحة للإضافة (غير موجودة في الامتحان)
    const availableQuestions = computed(() => {
      const currentIds = examQuestions.value.map((q) => q.firebaseKey || q.id);
      return questionsStore.questions.filter(
        (q) => !currentIds.includes(q.firebaseKey) && !currentIds.includes(q.id)
      );
    });

    // فلترة الأسئلة المتاحة
    const filteredAvailableQuestions = computed(() => {
      if (questionFilter.value === "all") return availableQuestions.value;
      return availableQuestions.value.filter(
        (q) => q.type === questionFilter.value
      );
    });

    // عدد الطلاب الذين قدموا
    const submissionsCount = computed(() => {
      return examsStore.getResultsByExam(examId.value).length;
    });

    // إحصائيات الأسئلة
    const multipleCount = computed(() => {
      return examQuestions.value.filter((q) => q.type === "multiple").length;
    });

    const trueFalseCount = computed(() => {
      return examQuestions.value.filter((q) => q.type === "truefalse").length;
    });

    // التحقق من اختيار سؤال جديد
    const isNewQuestionSelected = (id) => {
      return selectedNewQuestions.value.includes(id);
    };

    // حذف سؤال من الامتحان
    const removeQuestion = (index) => {
      if (confirm("هل أنت متأكد من حذف هذا السؤال من الامتحان؟")) {
        examQuestions.value.splice(index, 1);
      }
    };

    // إضافة الأسئلة المحددة
    const addSelectedQuestions = () => {
      selectedNewQuestions.value.forEach((id) => {
        const question = questionsStore.getQuestionById(id);
        if (question) {
          examQuestions.value.push({ ...question });
        }
      });
      selectedNewQuestions.value = [];
    };

    // حفظ التعديلات
    const updateExam = async () => {
      if (isSaving.value) return;
      isSaving.value = true;

      try {
        await examsStore.updateExam(examId.value, {
          title: form.value.title,
          description: form.value.description,
          duration: form.value.duration,
          questions: examQuestions.value,
          startDateTime: form.value.startDateTime || null,
          endDateTime: form.value.endDateTime || null,
        });

        alert("تم حفظ التعديلات بنجاح");
        router.push("/teacher/exams");
      } catch (error) {
        console.error("Error updating exam:", error);
        alert("حدث خطأ أثناء حفظ التعديلات. يرجى المحاولة مرة أخرى.");
      } finally {
        isSaving.value = false;
      }
    };

    return {
      isLoading,
      isSaving,
      form,
      examQuestions,
      selectedNewQuestions,
      questionFilter,
      availableQuestions,
      filteredAvailableQuestions,
      submissionsCount,
      multipleCount,
      trueFalseCount,
      isNewQuestionSelected,
      removeQuestion,
      addSelectedQuestions,
      updateExam,
    };
  },
};
</script>

<style scoped>
.exam-questions-list {
  max-height: 400px;
  overflow-y: auto;
}

.exam-question-item {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.2s;
}

.exam-question-item:hover {
  border-color: var(--primary-color);
  background: rgba(67, 97, 238, 0.03);
}

.question-number {
  background: var(--primary-color);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.question-text {
  font-size: 0.95rem;
  color: #333;
}

.question-actions {
  display: flex;
  gap: 8px;
}

.question-select-item {
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s;
}

.question-select-item:hover {
  background: #e9ecef;
}

.question-select-item.selected {
  background: rgba(67, 97, 238, 0.1);
  border: 1px solid var(--primary-color);
}

/* نافذة الوقت */
.time-window-card {
  border: 1.5px solid rgba(67, 97, 238, 0.2);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 8px;
}

.time-window-header {
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
  color: white;
  padding: 12px 18px;
  font-weight: 600;
  font-size: 0.95rem;
}

.time-window-body {
  padding: 16px 18px;
  background: rgba(67, 97, 238, 0.03);
}

.time-window-note {
  color: #6c757d;
  font-size: 0.82rem;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 8px 12px;
}
</style>
