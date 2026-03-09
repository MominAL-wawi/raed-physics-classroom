<template>
  <div class="dashboard-container">
    <div class="container">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2><i class="bi bi-question-circle me-2"></i>إدارة الأسئلة</h2>
        <button
          class="btn btn-primary-custom"
          data-bs-toggle="modal"
          data-bs-target="#questionModal"
          @click="resetForm"
        >
          <i class="bi bi-plus-circle me-2"></i>
          إضافة سؤال
        </button>
      </div>

      <!-- فلتر الأسئلة -->
      <div class="section-card mb-4">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-6">
              <div class="btn-group">
                <button
                  class="btn"
                  :class="
                    filter === 'all' ? 'btn-primary' : 'btn-outline-primary'
                  "
                  @click="filter = 'all'"
                >
                  الكل ({{ questionsStore.questions.length }})
                </button>
                <button
                  class="btn"
                  :class="
                    filter === 'multiple'
                      ? 'btn-primary'
                      : 'btn-outline-primary'
                  "
                  @click="filter = 'multiple'"
                >
                  اختيار من متعدد ({{
                    questionsStore.getMultipleChoiceQuestions.length
                  }})
                </button>
                <button
                  class="btn"
                  :class="
                    filter === 'truefalse'
                      ? 'btn-primary'
                      : 'btn-outline-primary'
                  "
                  @click="filter = 'truefalse'"
                >
                  صح/خطأ ({{ questionsStore.getTrueFalseQuestions.length }})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- قائمة الأسئلة -->
      <div v-if="filteredQuestions.length === 0" class="section-card">
        <div class="card-body">
          <div class="empty-state">
            <i class="bi bi-question-circle"></i>
            <h4>لا توجد أسئلة</h4>
            <p>ابدأ بإضافة أسئلة جديدة للامتحانات</p>
          </div>
        </div>
      </div>

      <div v-else>
        <QuestionCard
          v-for="question in filteredQuestions"
          :key="question.id"
          :question="question"
          @edit="editQuestion"
          @delete="deleteQuestion"
        />
      </div>

      <!-- Modal إضافة/تعديل سؤال -->
      <div class="modal fade" id="questionModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ editingQuestion ? "تعديل السؤال" : "إضافة سؤال جديد" }}
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveQuestion">
                <!-- نوع السؤال -->
                <div class="mb-3">
                  <label class="form-label">نوع السؤال</label>
                  <div class="btn-group w-100">
                    <button
                      type="button"
                      class="btn"
                      :class="
                        form.type === 'multiple'
                          ? 'btn-primary'
                          : 'btn-outline-primary'
                      "
                      @click="form.type = 'multiple'"
                    >
                      <i class="bi bi-list-ol me-2"></i>
                      اختيار من متعدد
                    </button>
                    <button
                      type="button"
                      class="btn"
                      :class="
                        form.type === 'truefalse'
                          ? 'btn-primary'
                          : 'btn-outline-primary'
                      "
                      @click="form.type = 'truefalse'"
                    >
                      <i class="bi bi-check-circle me-2"></i>
                      صح / خطأ
                    </button>
                  </div>
                </div>

                <!-- نص السؤال -->
                <div class="mb-3">
                  <label class="form-label">نص السؤال</label>
                  <textarea
                    class="form-control"
                    v-model="form.text"
                    rows="3"
                    required
                    placeholder="اكتب السؤال هنا..."
                  ></textarea>
                </div>

                <!-- صورة السؤال (اختياري) -->
                <div class="mb-3">
                  <label class="form-label">صورة السؤال (اختياري)</label>
                  <input
                    type="file"
                    class="form-control"
                    @change="handleImageUpload"
                    accept="image/*"
                  />
                  <img
                    v-if="form.image"
                    :src="form.image"
                    class="mt-2 question-image"
                  />
                </div>

                <!-- خيارات اختيار من متعدد -->
                <div v-if="form.type === 'multiple'" class="mb-3">
                  <label class="form-label">الخيارات</label>
                  <div
                    v-for="(option, index) in form.options"
                    :key="index"
                    class="input-group mb-2"
                  >
                    <span class="input-group-text">{{
                      String.fromCharCode(65 + index)
                    }}</span>
                    <input
                      type="text"
                      class="form-control"
                      v-model="form.options[index]"
                      :placeholder="`الخيار ${index + 1}`"
                      required
                    />
                    <button
                      v-if="index > 1"
                      type="button"
                      class="btn btn-outline-danger"
                      @click="removeOption(index)"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                  <button
                    v-if="form.options.length < 6"
                    type="button"
                    class="btn btn-outline-primary btn-sm"
                    @click="addOption"
                  >
                    <i class="bi bi-plus me-1"></i>
                    إضافة خيار
                  </button>
                </div>

                <!-- الإجابة الصحيحة -->
                <div class="mb-3">
                  <label class="form-label">الإجابة الصحيحة</label>
                  <select
                    v-if="form.type === 'multiple'"
                    class="form-select"
                    v-model="form.correctAnswer"
                    required
                  >
                    <option value="">اختر الإجابة الصحيحة</option>
                    <option
                      v-for="(option, index) in form.options"
                      :key="index"
                      :value="option"
                    >
                      {{ String.fromCharCode(65 + index) }} - {{ option }}
                    </option>
                  </select>
                  <div v-else class="btn-group w-100">
                    <button
                      type="button"
                      class="btn"
                      :class="
                        form.correctAnswer === 'true'
                          ? 'btn-success'
                          : 'btn-outline-success'
                      "
                      @click="form.correctAnswer = 'true'"
                    >
                      <i class="bi bi-check-circle me-2"></i>
                      صح
                    </button>
                    <button
                      type="button"
                      class="btn"
                      :class="
                        form.correctAnswer === 'false'
                          ? 'btn-danger'
                          : 'btn-outline-danger'
                      "
                      @click="form.correctAnswer = 'false'"
                    >
                      <i class="bi bi-x-circle me-2"></i>
                      خطأ
                    </button>
                  </div>
                </div>

                <div class="modal-footer px-0 pb-0">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    data-bs-dismiss="modal"
                    :disabled="isSaving"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    class="btn btn-primary-custom"
                    :disabled="isSaving"
                  >
                    <span
                      v-if="isSaving"
                      class="spinner-border spinner-border-sm me-2"
                    ></span>
                    <i v-else class="bi bi-check-lg me-2"></i>
                    {{
                      isSaving
                        ? "جاري الحفظ..."
                        : editingQuestion
                        ? "حفظ التعديلات"
                        : "إضافة السؤال"
                    }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useQuestionsStore } from "@/store/questionsStore";
import QuestionCard from "@/components/QuestionCard.vue";
import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap";
export default {
  name: "QuestionsPage",
  components: { QuestionCard },
  setup() {
    const questionsStore = useQuestionsStore();
    const filter = ref("all");
    const editingQuestion = ref(null);

    // تحميل البيانات من Firebase عند تحميل الصفحة
    onMounted(async () => {
      await questionsStore.loadQuestions();
    });

    const form = ref({
      type: "multiple",
      text: "",
      image: "",
      options: ["", "", "", ""],
      correctAnswer: "",
    });

    const filteredQuestions = computed(() => {
      if (filter.value === "all") return questionsStore.questions;
      return questionsStore.questions.filter((q) => q.type === filter.value);
    });

    const resetForm = () => {
      editingQuestion.value = null;
      form.value = {
        type: "multiple",
        text: "",
        image: "",
        options: ["", "", "", ""],
        correctAnswer: "",
      };
    };

    const addOption = () => {
      if (form.value.options.length < 6) {
        form.value.options.push("");
      }
    };

    const removeOption = (index) => {
      form.value.options.splice(index, 1);
    };

    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        // تحقق من حجم الملف (الحد الأقصى 500KB)
        if (file.size > 500 * 1024) {
          alert("حجم الصورة كبير جداً. الحد الأقصى 500KB");
          event.target.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          form.value.image = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    };

    const isSaving = ref(false);

    const saveQuestion = async () => {
      if (isSaving.value) return;
      isSaving.value = true;

      const questionData = {
        type: form.value.type,
        text: form.value.text,
        image: form.value.image,
        correctAnswer: form.value.correctAnswer,
      };

      if (form.value.type === "multiple") {
        questionData.options = form.value.options.filter(
          (o) => o.trim() !== ""
        );
      }

      try {
        if (editingQuestion.value) {
          await questionsStore.updateQuestion(
            editingQuestion.value.firebaseKey || editingQuestion.value.id,
            questionData
          );
        } else {
          await questionsStore.addQuestion(questionData);
        }

        // إغلاق Modal
        const modal = document.getElementById("questionModal");
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) {
          bootstrapModal.hide();
        }
        resetForm();
      } catch (error) {
        console.error("Error saving question:", error);
        alert("حدث خطأ أثناء حفظ السؤال. يرجى المحاولة مرة أخرى.");
      } finally {
        isSaving.value = false;
      }
    };

    const editQuestion = (question) => {
      editingQuestion.value = question;
      form.value = {
        type: question.type,
        text: question.text,
        image: question.image || "",
        options: question.options ? [...question.options] : ["", "", "", ""],
        correctAnswer: question.correctAnswer,
      };
      const modal = new bootstrap.Modal(
        document.getElementById("questionModal")
      );
      modal.show();
    };

    const deleteQuestion = async (firebaseKey) => {
      if (confirm("هل أنت متأكد من حذف هذا السؤال؟")) {
        await questionsStore.deleteQuestion(firebaseKey);
      }
    };

    return {
      questionsStore,
      filter,
      form,
      editingQuestion,
      filteredQuestions,
      isSaving,
      resetForm,
      addOption,
      removeOption,
      handleImageUpload,
      saveQuestion,
      editQuestion,
      deleteQuestion,
    };
  },
};
</script>
