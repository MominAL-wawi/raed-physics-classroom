<template>
  <div class="dashboard-container">
    <div class="container">
      <div class="d-flex align-items-center mb-4">
        <router-link to="/teacher/exams" class="btn btn-outline-primary me-3">
          <i class="bi bi-arrow-right"></i>
        </router-link>
        <h2 class="mb-0">
          <i class="bi bi-journal-plus me-2"></i>إنشاء امتحان جديد
        </h2>
      </div>

      <form @submit.prevent="createExam">
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
              </div>
            </div>

            <!-- اختيار الأسئلة -->
            <div class="section-card">
              <div
                class="card-header d-flex justify-content-between align-items-center"
              >
                <h5 class="mb-0">اختيار الأسئلة</h5>
                <span class="badge bg-light text-dark">
                  {{ selectedQuestions.length }} سؤال محدد
                </span>
              </div>
              <div class="card-body">
                <div
                  v-if="questionsStore.questions.length === 0"
                  class="empty-state py-4"
                >
                  <i class="bi bi-question-circle" style="font-size: 40px"></i>
                  <p class="mb-2">لا توجد أسئلة متاحة</p>
                  <router-link
                    to="/teacher/questions"
                    class="btn btn-primary-custom btn-sm"
                  >
                    إضافة أسئلة
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
                    style="max-height: 400px; overflow-y: auto"
                  >
                    <div
                      v-for="question in filteredQuestions"
                      :key="question.id"
                      class="form-check question-select-item p-3 mb-2 rounded"
                      :class="{ selected: isSelected(question.id) }"
                    >
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :id="'q-' + question.id"
                        :value="question.id"
                        v-model="selectedQuestions"
                      />
                      <label
                        class="form-check-label w-100"
                        :for="'q-' + question.id"
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
                    <strong>{{ selectedQuestions.length }}</strong>
                  </li>
                  <li class="d-flex justify-content-between py-2 border-bottom">
                    <span>المدة:</span>
                    <strong>{{ form.duration }} دقيقة</strong>
                  </li>
                  <li class="d-flex justify-content-between py-2">
                    <span>اختيار من متعدد:</span>
                    <strong>{{ selectedMultipleCount }}</strong>
                  </li>
                  <li class="d-flex justify-content-between py-2">
                    <span>صح/خطأ:</span>
                    <strong>{{ selectedTrueFalseCount }}</strong>
                  </li>
                </ul>

                <div class="d-grid gap-2">
                  <button
                    type="submit"
                    class="btn btn-primary-custom btn-lg"
                    :disabled="selectedQuestions.length === 0"
                  >
                    <i class="bi bi-check-lg me-2"></i>
                    إنشاء الامتحان
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
import { useRouter } from "vue-router";
import { useQuestionsStore } from "@/store/questionsStore";
import { useExamsStore } from "@/store/examsStore";

export default {
  name: "CreateExamPage",
  setup() {
    const router = useRouter();
    const questionsStore = useQuestionsStore();
    const examsStore = useExamsStore();

    // تحميل البيانات من Firebase عند تحميل الصفحة
    onMounted(async () => {
      await questionsStore.loadQuestions();
    });

    const form = ref({
      title: "",
      description: "",
      duration: 30,
    });

    const selectedQuestions = ref([]);
    const questionFilter = ref("all");

    const filteredQuestions = computed(() => {
      if (questionFilter.value === "all") return questionsStore.questions;
      return questionsStore.questions.filter(
        (q) => q.type === questionFilter.value
      );
    });

    const isSelected = (id) => selectedQuestions.value.includes(id);

    // استخدام firebaseKey أو id
    /* const getQuestionIdentifier = (question) =>
      question.firebaseKey || question.id;

    const selectedMultipleCount = computed(() => {
      return selectedQuestions.value.filter((id) => {
        const q = questionsStore.getQuestionById(id);
        return q?.type === "multiple";
      }).length;
    });*/

    const selectedTrueFalseCount = computed(() => {
      return selectedQuestions.value.filter((id) => {
        const q = questionsStore.getQuestionById(id);
        return q?.type === "truefalse";
      }).length;
    });

    const createExam = async () => {
      const questions = selectedQuestions.value.map((id) =>
        questionsStore.getQuestionById(id)
      );

      try {
        await examsStore.createExam({
          title: form.value.title,
          description: form.value.description,
          duration: form.value.duration,
          questions: questions,
        });

        router.push("/teacher/exams");
      } catch (error) {
        console.error("Error creating exam:", error);
      }
    };

    return {
      questionsStore,
      form,
      selectedQuestions,
      questionFilter,
      filteredQuestions,
      isSelected,
      // selectedMultipleCount,
      selectedTrueFalseCount,
      createExam,
    };
  },
};
</script>

<style scoped>
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
</style>
