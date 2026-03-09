<template>
  <div class="dashboard-container">
    <div class="container">
      <!-- رأس الامتحان -->
      <div class="exam-header">
        <div>
          <h4 class="mb-1">{{ exam?.title }}</h4>
          <span
            >{{ currentQuestionIndex + 1 }} / {{ questions.length }} سؤال</span
          >
        </div>
        <div class="timer" :class="timerClass">
          <i class="bi bi-clock me-2"></i>
          {{ formattedTime }}
        </div>
      </div>

      <!-- شريط التقدم -->
      <div class="progress-custom mb-4">
        <div
          class="progress-bar"
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>

      <!-- السؤال الحالي -->
      <div v-if="currentQuestion" class="exam-question">
        <div class="question-number">{{ currentQuestionIndex + 1 }}</div>

        <h5>{{ currentQuestion.text }}</h5>

        <img
          v-if="currentQuestion.image"
          :src="currentQuestion.image"
          alt="صورة السؤال"
          class="question-image mb-4"
        />

        <!-- خيارات اختيار من متعدد -->
        <div
          v-if="currentQuestion.type === 'multiple'"
          class="options-container"
        >
          <div
            v-for="(option, index) in currentQuestion.options"
            :key="index"
            class="answer-option"
            :class="{ selected: answers[currentQuestion.id] === option }"
            @click="selectAnswer(option)"
          >
            <input
              type="radio"
              :name="'q-' + currentQuestion.id"
              :value="option"
            />
            <span class="radio-custom"></span>
            <span class="option-text">{{ option }}</span>
          </div>
        </div>

        <!-- خيارات صح/خطأ -->
        <div v-else class="options-container">
          <div
            class="answer-option"
            :class="{ selected: answers[currentQuestion.id] === 'true' }"
            @click="selectAnswer('true')"
          >
            <input
              type="radio"
              :name="'q-' + currentQuestion.id"
              value="true"
            />
            <span class="radio-custom"></span>
            <span class="option-text"
              ><i class="bi bi-check-circle me-2 text-success"></i>صح</span
            >
          </div>
          <div
            class="answer-option"
            :class="{ selected: answers[currentQuestion.id] === 'false' }"
            @click="selectAnswer('false')"
          >
            <input
              type="radio"
              :name="'q-' + currentQuestion.id"
              value="false"
            />
            <span class="radio-custom"></span>
            <span class="option-text"
              ><i class="bi bi-x-circle me-2 text-danger"></i>خطأ</span
            >
          </div>
        </div>
      </div>

      <!-- أزرار التنقل -->
      <div class="d-flex justify-content-between mt-4">
        <button
          class="btn btn-outline-primary btn-lg"
          @click="previousQuestion"
          :disabled="currentQuestionIndex === 0"
        >
          <i class="bi bi-arrow-right me-2"></i>
          السابق
        </button>

        <button
          v-if="currentQuestionIndex < questions.length - 1"
          class="btn btn-primary-custom btn-lg"
          @click="nextQuestion"
        >
          التالي
          <i class="bi bi-arrow-left ms-2"></i>
        </button>

        <button
          v-else
          class="btn btn-success-custom btn-lg"
          @click="submitExam"
        >
          <i class="bi bi-check-lg me-2"></i>
          إنهاء الامتحان
        </button>
      </div>

      <!-- نظرة عامة على الأسئلة -->
      <div class="section-card mt-4">
        <div class="card-header">
          <h6 class="mb-0">نظرة عامة على الأسئلة</h6>
        </div>
        <div class="card-body">
          <div class="d-flex flex-wrap gap-2">
            <button
              v-for="(q, index) in questions"
              :key="q.id"
              class="btn btn-sm"
              :class="{
                'btn-success': answers[q.id],
                'btn-outline-secondary': !answers[q.id],
                'btn-primary': index === currentQuestionIndex,
              }"
              @click="goToQuestion(index)"
            >
              {{ index + 1 }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal النتيجة -->
    <div
      class="modal fade"
      id="resultModal"
      data-bs-backdrop="static"
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-body text-center p-5">
            <div class="result-score" :class="resultClass">{{ score }}%</div>
            <h3 class="mb-3">{{ resultMessage }}</h3>
            <p class="text-muted mb-4">
              أجبت على {{ correctAnswers }} من {{ questions.length }} سؤال بشكل
              صحيح
            </p>
            <router-link to="/student" class="btn btn-primary-custom btn-lg">
              <i class="bi bi-house me-2"></i>
              العودة للرئيسية
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "store/authStore";
import { useExamsStore } from "store/examsStore";

export default {
  name: "TakeExamPage",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const authStore = useAuthStore();
    const examsStore = useExamsStore();

    const exam = ref(null);
    const questions = ref([]);
    const currentQuestionIndex = ref(0);
    const answers = ref({});
    const timeRemaining = ref(0);
    const timerInterval = ref(null);
    const score = ref(0);
    const correctAnswers = ref(0);

    const currentQuestion = computed(
      () => questions.value[currentQuestionIndex.value]
    );

    const progressPercentage = computed(() => {
      const answered = Object.keys(answers.value).length;
      return (answered / questions.value.length) * 100;
    });

    const formattedTime = computed(() => {
      const minutes = Math.floor(timeRemaining.value / 60);
      const seconds = timeRemaining.value % 60;
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    });

    const timerClass = computed(() => {
      if (timeRemaining.value <= 60) return "danger";
      if (timeRemaining.value <= 300) return "warning";
      return "";
    });

    const resultClass = computed(() => {
      if (score.value >= 90) return "excellent";
      if (score.value >= 70) return "good";
      if (score.value >= 50) return "average";
      return "poor";
    });

    const resultMessage = computed(() => {
      if (score.value >= 90) return "ممتاز! أداء رائع";
      if (score.value >= 70) return "جيد جداً";
      if (score.value >= 50) return "جيد، يمكنك التحسن";
      return "تحتاج للمزيد من المذاكرة";
    });

    const selectAnswer = (answer) => {
      answers.value[currentQuestion.value.id] = answer;
    };

    const nextQuestion = () => {
      if (currentQuestionIndex.value < questions.value.length - 1) {
        currentQuestionIndex.value++;
      }
    };

    const previousQuestion = () => {
      if (currentQuestionIndex.value > 0) {
        currentQuestionIndex.value--;
      }
    };

    const goToQuestion = (index) => {
      currentQuestionIndex.value = index;
    };

    const calculateScore = () => {
      let correct = 0;
      questions.value.forEach((q) => {
        if (answers.value[q.id] === q.correctAnswer) {
          correct++;
        }
      });
      correctAnswers.value = correct;
      score.value = Math.round((correct / questions.value.length) * 100);
    };

    const submitExam = () => {
      clearInterval(timerInterval.value);
      calculateScore();

      // حفظ النتيجة
      examsStore.submitExamResult({
        examId: exam.value.id,
        examTitle: exam.value.title,
        studentEmail: authStore.user.email,
        studentName: authStore.user.name,
        answers: answers.value,
        score: score.value,
        correctAnswers: correctAnswers.value,
        totalQuestions: questions.value.length,
      });

      // عرض النتيجة
      const modal = new bootstrap.Modal(document.getElementById("resultModal"));
      modal.show();
    };

    const startTimer = () => {
      timerInterval.value = setInterval(() => {
        if (timeRemaining.value > 0) {
          timeRemaining.value--;
        } else {
          submitExam();
        }
      }, 1000);
    };

    onMounted(() => {
      const examId = route.params.id;
      exam.value = examsStore.getExamById(examId);

      if (!exam.value) {
        router.push("/student");
        return;
      }

      // التحقق من عدم إكمال الامتحان مسبقاً
      if (examsStore.hasStudentTakenExam(examId, authStore.user.email)) {
        alert("لقد أكملت هذا الامتحان مسبقاً");
        router.push("/student");
        return;
      }

      // توزيع الأسئلة عشوائياً
      questions.value = examsStore.getRandomizedQuestions(examId);
      timeRemaining.value = exam.value.duration * 60;

      startTimer();
    });

    onUnmounted(() => {
      if (timerInterval.value) {
        clearInterval(timerInterval.value);
      }
    });

    return {
      exam,
      questions,
      currentQuestionIndex,
      currentQuestion,
      answers,
      progressPercentage,
      formattedTime,
      timerClass,
      score,
      correctAnswers,
      resultClass,
      resultMessage,
      selectAnswer,
      nextQuestion,
      previousQuestion,
      goToQuestion,
      submitExam,
    };
  },
};
</script>
