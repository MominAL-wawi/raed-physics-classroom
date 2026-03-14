<template>
  <div class="dashboard-container">
    <div class="container">
      <!-- Header -->
      <div class="review-header mb-4">
        <div class="review-header-content">
          <router-link to="/student/results" class="btn-back">
            <i class="bi bi-arrow-right me-2"></i>
            العودة للنتائج
          </router-link>
          <div class="review-title-block">
            <h4 class="mb-1">مراجعة الامتحان</h4>
            <span class="exam-name">{{ result?.examTitle }}</span>
          </div>
          <div class="review-score-badge" :class="getScoreClass(result?.score)">
            {{ result?.score }}%
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-3 text-muted">جارٍ تحميل المراجعة...</p>
      </div>

      <!-- Review Not Allowed -->
      <div v-else-if="reviewNotAllowed" class="section-card">
        <div class="card-body">
          <div class="empty-state">
            <i class="bi bi-eye-slash"></i>
            <h4>المراجعة غير متاحة</h4>
            <p class="text-muted">
              الأستاذ لم يفعّل المراجعة لهذا الامتحان بعد
            </p>
            <router-link
              to="/student/results"
              class="btn btn-primary-custom mt-3"
            >
              العودة للنتائج
            </router-link>
          </div>
        </div>
      </div>

      <!-- Not Found -->
      <div v-else-if="!result" class="section-card">
        <div class="card-body">
          <div class="empty-state">
            <i class="bi bi-exclamation-circle"></i>
            <h4>لم يتم العثور على النتيجة</h4>
            <router-link
              to="/student/results"
              class="btn btn-primary-custom mt-3"
            >
              العودة للنتائج
            </router-link>
          </div>
        </div>
      </div>

      <template v-else>
        <!-- Summary Bar -->
        <div class="summary-bar mb-4">
          <div class="summary-item correct">
            <i class="bi bi-check-circle-fill"></i>
            <div>
              <span class="summary-num">{{ result.correctAnswers }}</span>
              <span class="summary-lbl">إجابات صحيحة</span>
            </div>
          </div>
          <div class="summary-item wrong">
            <i class="bi bi-x-circle-fill"></i>
            <div>
              <span class="summary-num">{{
                result.totalQuestions - result.correctAnswers
              }}</span>
              <span class="summary-lbl">إجابات خاطئة</span>
            </div>
          </div>
          <div class="summary-item total">
            <i class="bi bi-question-circle-fill"></i>
            <div>
              <span class="summary-num">{{ result.totalQuestions }}</span>
              <span class="summary-lbl">إجمالي الأسئلة</span>
            </div>
          </div>
        </div>

        <!-- Questions Review -->
        <div class="questions-list">
          <div
            v-for="(question, index) in reviewQuestions"
            :key="question.id"
            class="question-review-card"
            :class="question.isCorrect ? 'correct' : 'wrong'"
          >
            <!-- Question Header -->
            <div class="qr-header">
              <div
                class="qr-num"
                :class="question.isCorrect ? 'correct' : 'wrong'"
              >
                {{ index + 1 }}
              </div>
              <div
                class="qr-status"
                :class="question.isCorrect ? 'correct' : 'wrong'"
              >
                <i
                  :class="
                    question.isCorrect
                      ? 'bi bi-check-circle-fill'
                      : 'bi bi-x-circle-fill'
                  "
                ></i>
                {{ question.isCorrect ? "إجابة صحيحة" : "إجابة خاطئة" }}
              </div>
            </div>

            <!-- Question Text -->
            <h6 class="qr-text">{{ question.text }}</h6>

            <!-- Question Image -->
            <img
              v-if="question.image"
              :src="question.image"
              alt="صورة السؤال"
              class="qr-image mb-3"
            />

            <!-- Options -->
            <div class="qr-options">
              <!-- Multiple choice -->
              <template v-if="question.type === 'multiple'">
                <div
                  v-for="(option, oIdx) in question.options"
                  :key="oIdx"
                  class="qr-option"
                  :class="getOptionClass(question, option)"
                >
                  <div class="qr-option-icon">
                    <i
                      v-if="option === question.correctAnswer"
                      class="bi bi-check-lg text-success"
                    ></i>
                    <i
                      v-else-if="
                        option === question.studentAnswer &&
                        option !== question.correctAnswer
                      "
                      class="bi bi-x-lg text-danger"
                    ></i>
                    <span v-else class="option-letter">{{
                      optionLetters[oIdx]
                    }}</span>
                  </div>
                  <span>{{ option }}</span>
                  <span
                    v-if="option === question.correctAnswer"
                    class="option-tag correct-tag"
                    >الإجابة الصحيحة</span
                  >
                  <span
                    v-if="
                      option === question.studentAnswer &&
                      option !== question.correctAnswer
                    "
                    class="option-tag wrong-tag"
                    >إجابتك</span
                  >
                </div>
              </template>

              <!-- True/False -->
              <template v-else>
                <div
                  class="qr-option"
                  :class="getOptionClass(question, 'true')"
                >
                  <div class="qr-option-icon">
                    <i
                      v-if="'true' === question.correctAnswer"
                      class="bi bi-check-lg text-success"
                    ></i>
                    <i
                      v-else-if="
                        'true' === question.studentAnswer &&
                        'true' !== question.correctAnswer
                      "
                      class="bi bi-x-lg text-danger"
                    ></i>
                    <i v-else class="bi bi-check-circle text-muted"></i>
                  </div>
                  <span
                    ><i class="bi bi-check-circle me-2 text-success"></i
                    >صح</span
                  >
                  <span
                    v-if="'true' === question.correctAnswer"
                    class="option-tag correct-tag"
                    >الإجابة الصحيحة</span
                  >
                  <span
                    v-if="
                      'true' === question.studentAnswer &&
                      'true' !== question.correctAnswer
                    "
                    class="option-tag wrong-tag"
                    >إجابتك</span
                  >
                </div>
                <div
                  class="qr-option"
                  :class="getOptionClass(question, 'false')"
                >
                  <div class="qr-option-icon">
                    <i
                      v-if="'false' === question.correctAnswer"
                      class="bi bi-check-lg text-success"
                    ></i>
                    <i
                      v-else-if="
                        'false' === question.studentAnswer &&
                        'false' !== question.correctAnswer
                      "
                      class="bi bi-x-lg text-danger"
                    ></i>
                    <i v-else class="bi bi-x-circle text-muted"></i>
                  </div>
                  <span
                    ><i class="bi bi-x-circle me-2 text-danger"></i>خطأ</span
                  >
                  <span
                    v-if="'false' === question.correctAnswer"
                    class="option-tag correct-tag"
                    >الإجابة الصحيحة</span
                  >
                  <span
                    v-if="
                      'false' === question.studentAnswer &&
                      'false' !== question.correctAnswer
                    "
                    class="option-tag wrong-tag"
                    >إجابتك</span
                  >
                </div>
              </template>

              <!-- Unanswered -->
              <div v-if="!question.studentAnswer" class="unanswered-notice">
                <i class="bi bi-dash-circle me-2"></i>
                لم تُجب على هذا السؤال
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Action -->
        <div class="text-center mt-4 pb-4">
          <router-link
            to="/student/results"
            class="btn btn-primary-custom btn-lg me-3"
          >
            <i class="bi bi-arrow-right me-2"></i>
            العودة للنتائج
          </router-link>
          <router-link to="/student" class="btn btn-outline-primary btn-lg">
            <i class="bi bi-house me-2"></i>
            الرئيسية
          </router-link>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/store/authStore";
import { useExamsStore } from "@/store/examsStore";

export default {
  name: "ExamReviewPage",
  setup() {
    const route = useRoute();
    // const router = useRouter();
    const authStore = useAuthStore();
    const examsStore = useExamsStore();
    const isLoading = ref(true);
    const reviewNotAllowed = ref(false);
    const optionLetters = ["أ", "ب", "ج", "د", "هـ"];

    onMounted(async () => {
      await Promise.all([examsStore.loadExams(), examsStore.loadResults()]);

      // التحقق من أن المراجعة مسموحة
      const resultId = route.params.resultId;
      const foundResult = examsStore.results.find(
        (r) =>
          (r.firebaseKey === resultId || r.id === resultId) &&
          r.studentEmail === authStore.user?.email
      );

      if (foundResult) {
        const exam = examsStore.exams.find(
          (e) =>
            e.firebaseKey === foundResult.examId || e.id === foundResult.examId
        );
        if (!exam?.allowReview) {
          reviewNotAllowed.value = true;
        }
      }

      isLoading.value = false;
    });

    const result = computed(() => {
      const resultId = route.params.resultId;
      return examsStore.results.find(
        (r) =>
          (r.firebaseKey === resultId || r.id === resultId) &&
          r.studentEmail === authStore.user?.email
      );
    });

    const reviewQuestions = computed(() => {
      if (!result.value) return [];
      const exam = examsStore.exams.find(
        (e) =>
          e.firebaseKey === result.value.examId || e.id === result.value.examId
      );
      if (!exam) return [];

      return exam.questions.map((q) => {
        const studentAnswer = result.value.answers?.[q.id];
        const isCorrect = studentAnswer === q.correctAnswer;
        return {
          ...q,
          studentAnswer,
          isCorrect,
        };
      });
    });

    const getScoreClass = (score) => {
      if (score >= 90) return "excellent";
      if (score >= 70) return "good";
      if (score >= 50) return "average";
      return "poor";
    };

    const getOptionClass = (question, option) => {
      if (option === question.correctAnswer) return "correct";
      if (
        option === question.studentAnswer &&
        option !== question.correctAnswer
      )
        return "wrong";
      return "";
    };

    return {
      isLoading,
      reviewNotAllowed,
      result,
      reviewQuestions,
      optionLetters,
      getScoreClass,
      getOptionClass,
    };
  },
};
</script>

<style scoped>
/* Header */
.review-header {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07);
  overflow: hidden;
}

.review-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  flex-wrap: wrap;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  background: #f1f3f5;
  color: #495057;
  text-decoration: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-back:hover {
  background: #e9ecef;
  color: #1a1a2e;
}

.review-title-block {
  flex: 1;
  min-width: 0;
}

.review-title-block h4 {
  margin: 0 0 4px;
  color: #1a1a2e;
  font-weight: 700;
}

.exam-name {
  color: #6c757d;
  font-size: 0.9rem;
}

.review-score-badge {
  min-width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  color: white;
  flex-shrink: 0;
}

.review-score-badge.excellent {
  background: linear-gradient(135deg, #06d6a0, #00b894);
}
.review-score-badge.good {
  background: linear-gradient(135deg, #4361ee, #3f37c9);
}
.review-score-badge.average {
  background: linear-gradient(135deg, #ffd166, #fdcb6e);
  color: #333;
}
.review-score-badge.poor {
  background: linear-gradient(135deg, #ef476f, #d63031);
}

/* Summary Bar */
.summary-bar {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.summary-item {
  flex: 1;
  min-width: 130px;
  background: white;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  font-size: 1.6rem;
}

.summary-item.correct {
  color: #06d6a0;
  border-right: 4px solid #06d6a0;
}
.summary-item.wrong {
  color: #ef476f;
  border-right: 4px solid #ef476f;
}
.summary-item.total {
  color: #4361ee;
  border-right: 4px solid #4361ee;
}

.summary-item div {
  display: flex;
  flex-direction: column;
}

.summary-num {
  font-size: 1.7rem;
  font-weight: 800;
  color: #1a1a2e;
  line-height: 1;
}

.summary-lbl {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 3px;
}

/* Question Cards */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-review-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border-right: 5px solid transparent;
  transition: all 0.2s ease;
}

.question-review-card.correct {
  border-right-color: #06d6a0;
}
.question-review-card.wrong {
  border-right-color: #ef476f;
}

.qr-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.qr-num {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  color: white;
  flex-shrink: 0;
}

.qr-num.correct {
  background: #06d6a0;
}
.qr-num.wrong {
  background: #ef476f;
}

.qr-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 20px;
}

.qr-status.correct {
  background: rgba(6, 214, 160, 0.12);
  color: #06d6a0;
}
.qr-status.wrong {
  background: rgba(239, 71, 111, 0.12);
  color: #ef476f;
}

.qr-text {
  color: #1a1a2e;
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 16px;
  line-height: 1.6;
}

.qr-image {
  max-width: 100%;
  max-height: 250px;
  border-radius: 10px;
  display: block;
}

.qr-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qr-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border-radius: 10px;
  background: #f8f9fa;
  border: 2px solid transparent;
  font-size: 0.95rem;
  color: #495057;
  transition: all 0.2s;
}

.qr-option.correct {
  background: rgba(6, 214, 160, 0.1);
  border-color: #06d6a0;
  color: #1a1a2e;
  font-weight: 600;
}

.qr-option.wrong {
  background: rgba(239, 71, 111, 0.08);
  border-color: #ef476f;
  color: #1a1a2e;
}

.qr-option-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1rem;
}

.option-letter {
  color: #6c757d;
  font-weight: 600;
}

.option-tag {
  margin-right: auto;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
}

.correct-tag {
  background: rgba(6, 214, 160, 0.15);
  color: #06d6a0;
}

.wrong-tag {
  background: rgba(239, 71, 111, 0.15);
  color: #ef476f;
}

.unanswered-notice {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: rgba(108, 117, 125, 0.1);
  border-radius: 10px;
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 4px;
}

.empty-state {
  text-align: center;
  padding: 50px 20px;
  color: #6c757d;
}

.empty-state i {
  font-size: 3.5rem;
  display: block;
  margin-bottom: 16px;
  color: #dee2e6;
}

@media (max-width: 576px) {
  .review-header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  .summary-item {
    min-width: 100%;
  }
}
</style>
