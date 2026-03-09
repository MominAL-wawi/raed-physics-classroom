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

      <!-- تحذير في حالة المغادرة -->
      <div
        v-if="showLeaveWarning"
        class="alert alert-warning d-flex align-items-center mb-4"
      >
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <span
          >تنبيه: إذا غادرت الصفحة، سيستمر العد التنازلي وستتمكن من الاستكمال
          عند العودة</span
        >
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
import { useAuthStore } from "@/store/authStore";
import { useExamsStore } from "@/store/examsStore";
import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap";

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
    const showLeaveWarning = ref(false);

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

    // حفظ محلي فقط بدون Firebase - لا نرسل طلب عند كل إجابة
    const selectAnswer = (answer) => {
      answers.value[currentQuestion.value.id] = answer;
      // تحديث الـ store محلياً فقط
      const examId = exam.value.firebaseKey || exam.value.id;
      const key = `${examId}_${authStore.user.email}`;
      if (examsStore.ongoingExams[key]) {
        examsStore.ongoingExams[key].answers[currentQuestion.value.id] = answer;
      }
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

    const submitExam = async () => {
      clearInterval(timerInterval.value);
      calculateScore();

      // حفظ النتيجة
      await examsStore.submitExamResult({
        examId: exam.value.firebaseKey || exam.value.id,
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

    // عند تغيير الرؤية (مغادرة/عودة للصفحة)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // المستخدم غادر الصفحة - إظهار تحذير عند العودة
        showLeaveWarning.value = true;
      } else {
        // المستخدم عاد - إعادة حساب الوقت المتبقي
        const examId = route.params.id;
        const ongoingData = examsStore.startOrResumeExam(
          examId,
          authStore.user.email
        );
        if (ongoingData && !ongoingData.expired) {
          timeRemaining.value = ongoingData.timeRemaining;
        } else if (ongoingData && ongoingData.expired) {
          // انتهى الوقت أثناء الغياب
          timeRemaining.value = 0;
          submitExam();
        }
      }
    };

    // حفظ الحالة قبل المغادرة
    const handleBeforeUnload = (e) => {
      if (questions.value.length > 0 && timeRemaining.value > 0) {
        e.preventDefault();
        e.returnValue = "لديك امتحان جارٍ. هل أنت متأكد من المغادرة؟";
        return e.returnValue;
      }
    };

    onMounted(async () => {
      const examId = route.params.id;

      // تحميل الامتحانات والنتائج من Firebase
      await Promise.all([examsStore.loadExams(), examsStore.loadResults()]);

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

      // استكمال أو بدء امتحان جديد
      const ongoingData = await examsStore.startOrResumeExam(
        examId,
        authStore.user.email
      );

      if (ongoingData.expired) {
        // انتهى الوقت
        questions.value = ongoingData.questions;
        answers.value = ongoingData.answers;
        timeRemaining.value = 0;
        submitExam();
        return;
      }

      // استعادة حالة الامتحان
      questions.value = ongoingData.questions;
      answers.value = ongoingData.answers || {};
      currentQuestionIndex.value = ongoingData.currentQuestionIndex || 0;
      timeRemaining.value = ongoingData.timeRemaining;

      // إذا كان هناك امتحان سابق، أظهر تحذير
      if (Object.keys(ongoingData.answers).length > 0) {
        showLeaveWarning.value = true;
        setTimeout(() => {
          showLeaveWarning.value = false;
        }, 5000);
      }

      startTimer();

      // إضافة مستمعات الأحداث
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("beforeunload", handleBeforeUnload);
    });

    onUnmounted(() => {
      if (timerInterval.value) {
        clearInterval(timerInterval.value);
      }
      // إزالة مستمعات الأحداث
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
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
      showLeaveWarning,
      selectAnswer,
      nextQuestion,
      previousQuestion,
      goToQuestion,
      submitExam,
    };
  },
};
</script>

<style scoped>
.exam-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.timer {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 1.5rem;
  font-weight: bold;
}

.timer.warning {
  background: #ffc107;
  color: #000;
  animation: pulse 1s infinite;
}

.timer.danger {
  background: #dc3545;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.progress-custom {
  height: 10px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-custom .progress-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.exam-question {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  position: relative;
}

.question-number {
  position: absolute;
  top: -15px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.question-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 10px;
  display: block;
  margin: 1rem auto;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.answer-option {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.answer-option:hover {
  background: #e9ecef;
  transform: translateX(-5px);
}

.answer-option.selected {
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.1) 100%
  );
  border-color: #667eea;
}

.answer-option input {
  display: none;
}

.radio-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-radius: 50%;
  margin-left: 1rem;
  position: relative;
}

.answer-option.selected .radio-custom {
  border-color: #667eea;
}

.answer-option.selected .radio-custom::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #667eea;
  border-radius: 50%;
}

.result-score {
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.result-score.excellent {
  color: #28a745;
}
.result-score.good {
  color: #17a2b8;
}
.result-score.average {
  color: #ffc107;
}
.result-score.poor {
  color: #dc3545;
}

.section-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.section-card .card-header {
  background: #f8f9fa;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.section-card .card-body {
  padding: 1.5rem;
}

.btn-primary-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.btn-primary-custom:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
  color: white;
}

.btn-success-custom {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.btn-success-custom:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(40, 167, 69, 0.4);
  color: white;
}
</style>
