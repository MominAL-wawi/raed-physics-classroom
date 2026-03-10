<template>
  <div class="dashboard-container exam-secure-container">
    <!-- تحذير أمني -->
    <transition name="fade">
      <div v-if="securityWarningVisible" class="security-warning-overlay">
        <div class="security-warning-box">
          <i class="bi bi-shield-exclamation"></i>
          <p>{{ securityWarningMessage }}</p>
        </div>
      </div>
    </transition>

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

      <!-- تحذير انقطاع الاتصال -->
      <div
        v-if="isOffline"
        class="alert alert-info d-flex align-items-center mb-4"
      >
        <i class="bi bi-wifi-off me-2"></i>
        <span
          >أنت غير متصل بالإنترنت. لا تقلق! إجاباتك محفوظة محلياً وسيتم إرسالها
          عند عودة الاتصال.</span
        >
      </div>

      <!-- تحذير في حالة وجود نتيجة معلقة -->
      <div
        v-if="hasPendingSubmission"
        class="alert alert-success d-flex align-items-center mb-4"
      >
        <i class="bi bi-cloud-arrow-up me-2"></i>
        <span>جاري إرسال النتيجة المعلقة...</span>
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
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting">
            <span
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            جاري الإرسال...
          </span>
          <span v-else>
            <i class="bi bi-check-lg me-2"></i>
            إنهاء الامتحان
          </span>
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
            <button @click="goToHome" class="btn btn-primary-custom btn-lg">
              <i class="bi bi-house me-2"></i>
              العودة للرئيسية
            </button>
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
    const isSubmitting = ref(false);
    const submitError = ref(null);
    const isOffline = ref(!navigator.onLine);
    const hasPendingSubmission = ref(false);

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

    // حفظ محلي + localStorage للعمل أوفلاين
    const selectAnswer = (answer) => {
      answers.value[currentQuestion.value.id] = answer;
      // تحديث الـ store محلياً
      const examId = exam.value.firebaseKey || exam.value.id;
      const key = `${examId}_${authStore.user.email}`;
      if (examsStore.ongoingExams[key]) {
        examsStore.ongoingExams[key].answers[currentQuestion.value.id] = answer;
      }
      // حفظ في localStorage للعمل أوفلاين
      saveExamStateToLocal();
    };

    // حفظ حالة الامتحان محلياً
    const saveExamStateToLocal = () => {
      const examId = exam.value?.firebaseKey || exam.value?.id;
      if (!examId) return;

      const localState = {
        examId,
        studentEmail: authStore.user.email,
        questions: questions.value,
        answers: answers.value,
        currentQuestionIndex: currentQuestionIndex.value,
        startTime: exam.value.startTime || Date.now(),
        totalDuration: exam.value.duration * 60,
        savedAt: Date.now(),
      };
      localStorage.setItem(
        `exam_${examId}_${authStore.user.email}`,
        JSON.stringify(localState)
      );
    };

    // تحميل حالة الامتحان من localStorage
    const loadExamStateFromLocal = (examId) => {
      const key = `exam_${examId}_${authStore.user.email}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
      return null;
    };

    // حذف حالة الامتحان المحلية
    const clearLocalExamState = (examId) => {
      localStorage.removeItem(`exam_${examId}_${authStore.user.email}`);
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

    const submitExam = async (retryCount = 0) => {
      // منع التقديم المتكرر
      if (isSubmitting.value) return;

      isSubmitting.value = true;
      submitError.value = null;

      // إيقاف المؤقت
      if (timerInterval.value) {
        clearInterval(timerInterval.value);
        timerInterval.value = null;
      }

      calculateScore();

      const resultData = {
        examId: exam.value.firebaseKey || exam.value.id,
        examTitle: exam.value.title,
        studentEmail: authStore.user.email,
        studentName: authStore.user.name,
        answers: answers.value,
        score: score.value,
        correctAnswers: correctAnswers.value,
        totalQuestions: questions.value.length,
      };

      // حفظ النتيجة محلياً أولاً (للحماية من انقطاع الاتصال)
      savePendingSubmission(resultData);

      try {
        // محاولة إرسال النتيجة
        await examsStore.submitExamResult(resultData);

        // نجح الإرسال - حذف البيانات المحلية
        clearPendingSubmission();
        clearLocalExamState(resultData.examId);

        // عرض النتيجة بعد نجاح الحفظ
        showResultModal();
      } catch (error) {
        console.error("Error submitting exam:", error);
        submitError.value = error.message;

        // إذا كان أوفلاين، نعرض النتيجة ونحفظ محلياً
        if (!navigator.onLine) {
          alert(
            "أنت غير متصل بالإنترنت. تم حفظ نتيج��ك محلياً وسيتم إرسالها تلقائياً عند عودة الاتصال."
          );
          showResultModal();
          return;
        }

        // إعادة المحاولة (بحد أقصى 3 مرات)
        if (retryCount < 3) {
          console.log(`Retrying submission... attempt ${retryCount + 1}`);
          isSubmitting.value = false;
          setTimeout(() => submitExam(retryCount + 1), 2000);
        } else {
          // فشل نهائي - عرض النتيجة على أي حال مع رسالة خطأ
          alert(
            "حدث خطأ أثناء حفظ النتيجة في السيرفر. تم حفظها محلياً وسيتم إرسالها عند عودة الاتصال."
          );
          showResultModal();
        }
      }
    };

    // حفظ النتيجة المعلقة في localStorage
    const savePendingSubmission = (resultData) => {
      localStorage.setItem(
        `pending_result_${resultData.examId}_${resultData.studentEmail}`,
        JSON.stringify({ ...resultData, savedAt: Date.now() })
      );
    };

    // حذف النتيجة المعلقة
    const clearPendingSubmission = () => {
      const examId = exam.value?.firebaseKey || exam.value?.id;
      if (examId) {
        localStorage.removeItem(
          `pending_result_${examId}_${authStore.user.email}`
        );
      }
    };

    // محاولة إرسال النتائج المعلقة
    const syncPendingSubmissions = async () => {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith("pending_result_")
      );

      for (const key of keys) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.studentEmail === authStore.user.email) {
            hasPendingSubmission.value = true;
            await examsStore.submitExamResult(data);
            localStorage.removeItem(key);
            // حذف حالة الامتحان المحلية أيضاً
            clearLocalExamState(data.examId);
          }
        } catch (error) {
          console.error("Error syncing pending submission:", error);
        }
      }
      hasPendingSubmission.value = false;
    };

    const showResultModal = () => {
      try {
        const modalEl = document.getElementById("resultModal");
        if (modalEl) {
          // تنظيف أي modal موجود مسبقاً
          const existingModal = bootstrap.Modal.getInstance(modalEl);
          if (existingModal) {
            existingModal.dispose();
          }
          const modal = new bootstrap.Modal(modalEl);
          modal.show();
        }
      } catch (modalError) {
        console.error("Error showing modal:", modalError);
        // إذا فشل عرض Modal، انتقل للصفحة الرئيسية مباشرة
        router.push("/student");
      } finally {
        isSubmitting.value = false;
      }
    };

    const goToHome = () => {
      try {
        // إغلاق الـ Modal بشكل صحيح قبل الانتقال
        const modalEl = document.getElementById("resultModal");
        if (modalEl) {
          const modalInstance = bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) {
            modalInstance.hide();
            // انتظر حتى يتم إغلاق الـ Modal تماماً
            modalEl.addEventListener(
              "hidden.bs.modal",
              () => {
                modalInstance.dispose();
                // إزالة backdrop يدوياً إذا لزم الأمر
                const backdrop = document.querySelector(".modal-backdrop");
                if (backdrop) {
                  backdrop.remove();
                }
                document.body.classList.remove("modal-open");
                document.body.style.removeProperty("overflow");
                document.body.style.removeProperty("padding-right");
                router.push("/student");
              },
              { once: true }
            );
          } else {
            router.push("/student");
          }
        } else {
          router.push("/student");
        }
      } catch (error) {
        console.error("Error closing modal:", error);
        // تنظيف يدوي في حالة الخطأ
        const backdrop = document.querySelector(".modal-backdrop");
        if (backdrop) {
          backdrop.remove();
        }
        document.body.classList.remove("modal-open");
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("padding-right");
        router.push("/student");
      }
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
        // المستخدم غادر الصفحة - حفظ الحالة فقط بدون تسليم
        saveExamStateToLocal();
        showLeaveWarning.value = true;
        // لا نسلم الامتحان - فقط نحفظ الحالة والوقت يستمر
      } else {
        // المستخدم عاد - استمرار الامتحان بشكل طبيعي
        // حساب الوقت المنقضي أثناء الغياب
        const examId = exam.value?.firebaseKey || exam.value?.id;
        if (examId) {
          const localState = loadExamStateFromLocal(examId);
          if (localState) {
            // حساب الوقت المنقضي منذ آخر حفظ
            const elapsedSinceLastSave = Math.floor(
              (Date.now() - localState.savedAt) / 1000
            );
            // تحديث الوقت المتبقي (الوقت يستمر حتى أثناء الغياب)
            const newTimeRemaining = Math.max(
              timeRemaining.value - elapsedSinceLastSave,
              0
            );
            timeRemaining.value = newTimeRemaining;

            // إذا انتهى الوقت أثناء الغياب، نسلم الامتحان
            if (newTimeRemaining <= 0) {
              submitExam();
              return;
            }
          }
        }
        // لا نسلم الامتحان - الطالب يستمر من حيث توقف
        showLeaveWarning.value = true;
        setTimeout(() => {
          showLeaveWarning.value = false;
        }, 3000);
      }
    };

    // حفظ الحالة قبل المغادرة
    const handleBeforeUnload = (e) => {
      if (questions.value.length > 0 && timeRemaining.value > 0) {
        // حفظ الحالة محلياً قبل المغادرة
        saveExamStateToLocal();
        e.preventDefault();
        e.returnValue = "لديك امتحان جارٍ. هل أنت متأكد من المغادرة؟";
        return e.returnValue;
      }
    };

    // مراقبة حالة الاتصال
    const handleOnline = () => {
      isOffline.value = false;
      // محاولة إرسال النتائج المعلقة عند عودة الاتصال
      syncPendingSubmissions();
    };

    const handleOffline = () => {
      isOffline.value = true;
    };

    // مرجع لتخزين event listeners للتنظيف لاحقاً
    const eventListeners = ref([]);
    const securityWarningVisible = ref(false);
    const securityWarningMessage = ref("");

    // عرض تحذير أمني
    const showSecurityWarning = (message) => {
      securityWarningMessage.value = message;
      securityWarningVisible.value = true;
      setTimeout(() => {
        securityWarningVisible.value = false;
      }, 3000);
    };

    // منع تصوير الشاشة وتسجيل الفيديو
    const preventScreenCapture = () => {
      // إضافة CSS لمنع التقاط الشاشة (Content Protection)
      const style = document.createElement("style");
      style.id = "exam-protection-styles";
      style.textContent = `
        .exam-secure-container {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        
        /* إخفاء المحتوى عند التقاط الشاشة في iOS/macOS */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          .exam-secure-container {
            -webkit-backdrop-filter: blur(0);
          }
        }
        
        /* منع الطباعة */
        @media print {
          .exam-secure-container * {
            display: none !important;
          }
          body::after {
            content: "طباعة الامتحان غير مسموحة" !important;
            display: block !important;
            font-size: 48px !important;
            text-align: center !important;
            padding: 100px !important;
          }
        }
      `;
      document.head.appendChild(style);

      // منع النسخ
      const copyHandler = (e) => {
        if (questions.value.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };
      document.addEventListener("copy", copyHandler, true);
      eventListeners.value.push({ type: "copy", handler: copyHandler });

      // منع القص
      const cutHandler = (e) => {
        if (questions.value.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };
      document.addEventListener("cut", cutHandler, true);
      eventListeners.value.push({ type: "cut", handler: cutHandler });

      // منع اللصق
      const pasteHandler = (e) => {
        if (questions.value.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };
      document.addEventListener("paste", pasteHandler, true);
      eventListeners.value.push({ type: "paste", handler: pasteHandler });

      // منع النقر بالزر الأيمن
      const contextHandler = (e) => {
        if (questions.value.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };
      document.addEventListener("contextmenu", contextHandler, true);
      eventListeners.value.push({
        type: "contextmenu",
        handler: contextHandler,
      });

      // منع تحديد النص
      const selectHandler = (e) => {
        if (questions.value.length > 0) {
          e.preventDefault();
          window.getSelection()?.removeAllRanges();
        }
      };
      document.addEventListener("selectstart", selectHandler, true);
      eventListeners.value.push({
        type: "selectstart",
        handler: selectHandler,
      });

      // منع اختصارات لوحة المفاتيح للتصوير
      const keydownHandler = (e) => {
        if (questions.value.length > 0) {
          // منع Print Screen
          if (e.key === "PrintScreen" || e.code === "PrintScreen") {
            e.preventDefault();
            e.stopPropagation();
            // مسح الحافظة فوراً
            navigator.clipboard?.writeText?.("");
            showSecurityWarning("تصوير الشاشة غير مسموح أثناء الامتحان");
            return false;
          }
          // منع Ctrl+P (طباعة)
          if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
            e.preventDefault();
            e.stopPropagation();
            showSecurityWarning("الطباعة غير مسموحة أثناء الامتحان");
            return false;
          }
          // منع Ctrl+S (حفظ)
          if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
          // منع Ctrl+Shift+S (لقطة شاشة في بعض المتصفحات)
          if (
            (e.ctrlKey || e.metaKey) &&
            e.shiftKey &&
            (e.key === "s" || e.key === "S")
          ) {
            e.preventDefault();
            e.stopPropagation();
            showSecurityWarning("تصوير الشاشة غير مسموح أثناء الامتحان");
            return false;
          }
          // منع Cmd+Shift+3 و Cmd+Shift+4 و Cmd+Shift+5 (Mac screenshots)
          if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            showSecurityWarning("تصوير الشاشة غير مسموح أثناء الامتحان");
            return false;
          }
          // منع Win+Shift+S (Windows Snipping Tool)
          if (e.metaKey && e.shiftKey && (e.key === "s" || e.key === "S")) {
            e.preventDefault();
            e.stopPropagation();
            showSecurityWarning("تصوير الشاشة غير مسموح أثناء الامتحان");
            return false;
          }
          // منع Win+G (Windows Game Bar للتسجيل)
          if (e.metaKey && (e.key === "g" || e.key === "G")) {
            e.preventDefault();
            e.stopPropagation();
            showSecurityWarning("تسجيل الشاشة غير مسموح أثناء الامتحان");
            return false;
          }
          // منع Ctrl+Shift+I (Developer Tools)
          if (
            (e.ctrlKey || e.metaKey) &&
            e.shiftKey &&
            (e.key === "I" || e.key === "i")
          ) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
          // منع Ctrl+Shift+J (Console)
          if (
            (e.ctrlKey || e.metaKey) &&
            e.shiftKey &&
            (e.key === "J" || e.key === "j")
          ) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
          // منع Ctrl+U (View Source)
          if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U")) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
          // منع F12 (Developer Tools)
          if (e.key === "F12") {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
          // منع Ctrl+C (نسخ)
          if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
          // منع Ctrl+A (تحديد الكل)
          if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }
      };
      document.addEventListener("keydown", keydownHandler, true);
      eventListeners.value.push({ type: "keydown", handler: keydownHandler });

      // منع keyup لـ PrintScreen أيضاً
      const keyupHandler = (e) => {
        if (
          questions.value.length > 0 &&
          (e.key === "PrintScreen" || e.code === "PrintScreen")
        ) {
          // مسح الحافظة عند رفع زر PrintScreen
          navigator.clipboard?.writeText?.("");
        }
      };
      document.addEventListener("keyup", keyupHandler, true);
      eventListeners.value.push({ type: "keyup", handler: keyupHandler });

      // محاولة منع تسجيل الشاشة عبر CSS
      const examContainer = document.querySelector(".exam-secure-container");
      if (examContainer) {
        // إضافة حماية إضافية عبر CSS
        examContainer.style.setProperty("-webkit-touch-callout", "none");
        examContainer.style.setProperty("-webkit-user-select", "none");
        examContainer.style.setProperty("-khtml-user-select", "none");
        examContainer.style.setProperty("-moz-user-select", "none");
        examContainer.style.setProperty("-ms-user-select", "none");
        examContainer.style.setProperty("user-select", "none");
      }

      // محاولة الكشف عن Screen Recording/Sharing APIs
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        // نحاول اكتشاف محاولات تسجيل الشاشة
        const originalGetDisplayMedia =
          navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getDisplayMedia = async function (constraints) {
          if (questions.value.length > 0) {
            showSecurityWarning("تسجيل/مشاركة الشاشة غير مسموح أثناء الامتحان");
            throw new Error("Screen recording is not allowed during exam");
          }
          return originalGetDisplayMedia(constraints);
        };
      }

      // منع getUserMedia للكاميرا/الميكروفون أثناء الامتحان
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(
          navigator.mediaDevices
        );
        navigator.mediaDevices.getUserMedia = async function (constraints) {
          if (questions.value.length > 0 && constraints.video) {
            showSecurityWarning(
              "استخدام الكاميرا للتسجيل غير مسموح أثناء الامتحان"
            );
            throw new Error("Camera recording is not allowed during exam");
          }
          return originalGetUserMedia(constraints);
        };
      }

      // الكشف عن مشاركة الشاشة (Screen Sharing Detection)
      if (navigator.mediaDevices) {
        const deviceChangeHandler = () => {
          // تم تغيير الأجهزة - قد يكون هناك مشاركة شاشة
          console.log("Device change detected");
        };
        navigator.mediaDevices.addEventListener(
          "devicechange",
          deviceChangeHandler
        );
      }

      // الكشف عن Picture-in-Picture
      if ("pictureInPictureEnabled" in document) {
        document.addEventListener("enterpictureinpicture", () => {
          if (questions.value.length > 0) {
            document.exitPictureInPicture?.();
            showSecurityWarning("وضع صورة في صورة غير مسموح أثناء الامتحان");
          }
        });
      }

      // مراقبة فتح DevTools
      const devToolsDetector = () => {
        const threshold = 160;
        const widthThreshold =
          window.outerWidth - window.innerWidth > threshold;
        const heightThreshold =
          window.outerHeight - window.innerHeight > threshold;

        if (widthThreshold || heightThreshold) {
          if (questions.value.length > 0) {
            showSecurityWarning("يرجى إغلاق أدوات المطور أثناء الامتحان");
          }
        }
      };

      // فحص DevTools كل ثانية
      const devToolsInterval = setInterval(devToolsDetector, 1000);

      // تخزين interval للتنظيف لاحقاً
      eventListeners.value.push({
        type: "interval",
        handler: devToolsInterval,
      });

      // تعتيم المحتوى عند فقدان التركيز (الخروج من النافذة)
      const blurHandler = () => {
        if (questions.value.length > 0) {
          const container = document.querySelector(".exam-secure-container");
          if (container) {
            container.classList.add("blurred-content");
          }
          showSecurityWarning("يرجى البقاء في صفحة الامتحان");
        }
      };

      const focusHandler = () => {
        const container = document.querySelector(".exam-secure-container");
        if (container) {
          container.classList.remove("blurred-content");
        }
      };

      window.addEventListener("blur", blurHandler);
      window.addEventListener("focus", focusHandler);
      eventListeners.value.push({
        type: "blur",
        handler: blurHandler,
        target: window,
      });
      eventListeners.value.push({
        type: "focus",
        handler: focusHandler,
        target: window,
      });

      // مراقبة الحافظة ومسحها باستمرار أثناء الامتحان
      const clipboardInterval = setInterval(() => {
        if (questions.value.length > 0) {
          navigator.clipboard?.writeText?.("").catch(() => {});
        }
      }, 500);
      eventListeners.value.push({
        type: "interval",
        handler: clipboardInterval,
      });

      // منع Drag & Drop للصور والنصوص
      const dragStartHandler = (e) => {
        if (questions.value.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };
      document.addEventListener("dragstart", dragStartHandler, true);
      eventListeners.value.push({
        type: "dragstart",
        handler: dragStartHandler,
      });

      // منع فتح روابط جديدة
      const clickHandler = (e) => {
        if (questions.value.length > 0 && e.target.tagName === "A") {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      document.addEventListener("click", clickHandler, true);
      eventListeners.value.push({ type: "click", handler: clickHandler });

      // منع السحب والإفلات للصور
      const dragHandler = (e) => {
        if (questions.value.length > 0) {
          e.preventDefault();
        }
      };
      document.addEventListener("dragstart", dragHandler);
      eventListeners.value.push({ type: "dragstart", handler: dragHandler });
    };

    // تنظيف event listeners عند مغادرة الصفحة
    const cleanupEventListeners = () => {
      eventListeners.value.forEach(({ type, handler, target }) => {
        if (type === "interval") {
          clearInterval(handler);
        } else if (target === window) {
          window.removeEventListener(type, handler);
        } else {
          document.removeEventListener(type, handler, true);
        }
      });
      eventListeners.value = [];

      // إزالة أنماط الحماية
      const protectionStyles = document.getElementById(
        "exam-protection-styles"
      );
      if (protectionStyles) {
        protectionStyles.remove();
      }

      // إزالة تعتيم المحتوى
      const container = document.querySelector(".exam-secure-container");
      if (container) {
        container.classList.remove("blurred-content");
      }
    };

    onMounted(async () => {
      const examId = route.params.id;

      // إضافة مستمعات حالة الاتصال
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // تفعيل حماية تصوير الشاشة
      preventScreenCapture();

      // محاولة إرسال النتائج المعلقة عند بدء التطبيق
      if (navigator.onLine) {
        syncPendingSubmissions();
      }

      // التحقق من وجود حالة محفوظة محلياً أولاً (للعمل أوفلاين)
      const localState = loadExamStateFromLocal(examId);

      try {
        // محاولة تحميل الامتحانات والنتائج من Firebase
        await Promise.all([examsStore.loadExams(), examsStore.loadResults()]);
      } catch (error) {
        console.error("Error loading from Firebase:", error);
        // إذا فشل التحميل وكان هناك حالة محلية، نستخدمها
        if (localState && !navigator.onLine) {
          exam.value = {
            firebaseKey: localState.examId,
            id: localState.examId,
            duration: localState.totalDuration / 60,
            title: "امتحان (وضع أوفلاين)",
          };
          questions.value = localState.questions;
          answers.value = localState.answers || {};
          currentQuestionIndex.value = localState.currentQuestionIndex || 0;

          const elapsedSeconds = Math.floor(
            (Date.now() - localState.savedAt) / 1000
          );
          const remaining = localState.totalDuration - elapsedSeconds;
          timeRemaining.value = remaining > 0 ? remaining : 0;

          if (timeRemaining.value <= 0) {
            submitExam();
            return;
          }

          startTimer();
          document.addEventListener("visibilitychange", handleVisibilityChange);
          window.addEventListener("beforeunload", handleBeforeUnload);
          return;
        }
      }

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

      // استعادة حالة الامتحان (نفضل الحالة المحلية إذا كانت أحدث)
      if (localState && localState.savedAt > ongoingData.startTime) {
        questions.value = localState.questions;
        answers.value = localState.answers || {};
        currentQuestionIndex.value = localState.currentQuestionIndex || 0;

        const elapsedSeconds = Math.floor(
          (Date.now() - localState.savedAt) / 1000
        );
        const savedRemaining =
          localState.totalDuration -
          Math.floor((localState.savedAt - ongoingData.startTime) / 1000);
        timeRemaining.value = Math.max(savedRemaining - elapsedSeconds, 0);
      } else {
        questions.value = ongoingData.questions;
        answers.value = ongoingData.answers || {};
        currentQuestionIndex.value = ongoingData.currentQuestionIndex || 0;
        timeRemaining.value = ongoingData.timeRemaining;
      }

      // إذا كان هناك امتحان سابق، أظهر تحذير
      if (Object.keys(answers.value).length > 0) {
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
      // حفظ الحالة قبل المغادرة
      if (questions.value.length > 0 && timeRemaining.value > 0) {
        saveExamStateToLocal();
      }
      // إزالة مستمعات الأحداث
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      // تنظيف event listeners الخاصة بحماية الشاشة
      cleanupEventListeners();
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
      isOffline,
      hasPendingSubmission,
      securityWarningVisible,
      securityWarningMessage,
      selectAnswer,
      nextQuestion,
      previousQuestion,
      goToQuestion,
      submitExam,
      isSubmitting,
      goToHome,
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

/* حماية متقدمة من تصوير الشاشة */
.exam-secure-container {
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
  user-select: none !important;
  -webkit-touch-callout: none !important;
  -webkit-tap-highlight-color: transparent !important;
  /* حماية DRM-like للمحتوى */
  -webkit-user-drag: none !important;
  pointer-events: auto;
}

/* منع تحديد أي نص داخل الحاوية */
.exam-secure-container * {
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
  user-select: none !important;
}

/* CSS لمنع التقاط الشاشة (يعمل على بعض المتصفحات) */
@media print {
  .exam-secure-container,
  .exam-secure-container * {
    display: none !important;
    visibility: hidden !important;
  }
  body::before {
    content: "طباعة الامتحان غير مسموحة - Printing is not allowed" !important;
    display: block !important;
    font-size: 36px !important;
    text-align: center !important;
    padding: 200px 50px !important;
    color: #dc3545 !important;
    font-weight: bold !important;
  }
}

/* إخفاء المحتوى عند محاولة التسجيل (Picture-in-Picture) */
.exam-secure-container:fullscreen {
  background: black;
}

/* تعتيم عند فقدان التركيز */
.exam-secure-container.blurred-content .question-card,
.exam-secure-container.blurred-content .card {
  filter: blur(20px) !important;
  pointer-events: none !important;
  transition: filter 0.1s ease !important;
}

.exam-secure-container.blurred-content::after {
  content: "يرجى العودة للامتحان - الخروج غير مسموح";
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(220, 53, 69, 0.95);
  color: white;
  padding: 30px 50px;
  border-radius: 15px;
  font-size: 24px;
  font-weight: bold;
  z-index: 10000;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

/* تحذير أمني */
.security-warning-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(220, 53, 69, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.security-warning-box {
  background: white;
  padding: 40px 60px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: shake 0.5s ease-in-out;
}

.security-warning-box i {
  font-size: 80px;
  color: #dc3545;
  margin-bottom: 20px;
  display: block;
}

.security-warning-box p {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-10px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(10px);
  }
}

/* انتقالات */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
