import { defineStore } from "pinia";
import { firebaseDB, DB_PATHS } from "../firebase/config";

export const useExamsStore = defineStore("exams", {
  state: () => ({
    exams: [],
    results: [],
    ongoingExams: {},
    isLoading: false,
  }),

  getters: {
    getAllExams: (state) => state.exams,
    getActiveExams: (state) => {
      const now = new Date();
      return state.exams.filter((e) => {
        if (!e.isActive) return false;
        // إذا لم تُحدد نافذة وقت → متاح دائماً
        if (!e.startDateTime && !e.endDateTime) return true;
        const start = e.startDateTime ? new Date(e.startDateTime) : null;
        const end = e.endDateTime ? new Date(e.endDateTime) : null;
        if (start && now < start) return false; // لم يبدأ بعد
        if (end && now > end) return false; // انتهى
        return true;
      });
    },
    // جميع الامتحانات النشطة بغض النظر عن الوقت (للمعلم)
    getAllActiveExams: (state) => state.exams.filter((e) => e.isActive),
    getExamById: (state) => (id) =>
      state.exams.find((e) => e.firebaseKey === id || e.id === id),
    getResultsByExam: (state) => (examId) =>
      state.results.filter((r) => r.examId === examId),
    getResultsByStudent: (state) => (studentEmail) =>
      state.results.filter((r) => r.studentEmail === studentEmail),
    hasStudentTakenExam: (state) => (examId, studentEmail) => {
      return state.results.some(
        (r) => r.examId === examId && r.studentEmail === studentEmail
      );
    },
    getOngoingExam: (state) => (examId, studentEmail) => {
      const key = `${examId}_${studentEmail}`;
      return state.ongoingExams[key] || null;
    },
    // إرجاع حالة وقت الامتحان: 'upcoming' | 'open' | 'ended' | 'no-window'
    getExamTimeStatus: () => (exam) => {
      if (!exam) return "no-window";
      if (!exam.startDateTime && !exam.endDateTime) return "no-window";
      const now = new Date();
      const start = exam.startDateTime ? new Date(exam.startDateTime) : null;
      const end = exam.endDateTime ? new Date(exam.endDateTime) : null;
      if (start && now < start) return "upcoming";
      if (end && now > end) return "ended";
      return "open";
    },
  },

  actions: {
    // تحميل جميع الامتحانات من Firebase
    async loadExams() {
      this.isLoading = true;
      try {
        const data = await firebaseDB.get(DB_PATHS.EXAMS);
        this.exams = firebaseDB.objectToArray(data);
      } catch (error) {
        console.error("Error loading exams:", error);
      } finally {
        this.isLoading = false;
      }
    },

    // تحميل النتائج من Firebase
    async loadResults() {
      this.isLoading = true;
      try {
        const data = await firebaseDB.get(DB_PATHS.RESULTS);
        this.results = firebaseDB.objectToArray(data);
      } catch (error) {
        console.error("Error loading results:", error);
      } finally {
        this.isLoading = false;
      }
    },

    // تحميل الامتحانات الجارية
    async loadOngoingExams() {
      try {
        const data = await firebaseDB.get(DB_PATHS.ONGOING_EXAMS);
        this.ongoingExams = data || {};
      } catch (error) {
        console.error("Error loading ongoing exams:", error);
      }
    },

    // تحميل جميع البيانات
    async loadAllData() {
      await Promise.all([
        this.loadExams(),
        this.loadResults(),
        this.loadOngoingExams(),
      ]);
    },

    async createExam(exam) {
      try {
        const newExam = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          isActive: true,
          ...exam,
        };
        const firebaseKey = await firebaseDB.post(DB_PATHS.EXAMS, newExam);
        const examWithKey = { ...newExam, firebaseKey };
        this.exams.push(examWithKey);
        return examWithKey;
      } catch (error) {
        console.error("Error creating exam:", error);
        throw error;
      }
    },

    async updateExam(firebaseKey, updates) {
      try {
        await firebaseDB.patch(DB_PATHS.EXAMS, firebaseKey, updates);
        const index = this.exams.findIndex(
          (e) => e.firebaseKey === firebaseKey
        );
        if (index !== -1) {
          this.exams[index] = { ...this.exams[index], ...updates };
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error updating exam:", error);
        throw error;
      }
    },

    async toggleExamStatus(firebaseKey) {
      const exam = this.exams.find((e) => e.firebaseKey === firebaseKey);
      if (exam) {
        const newStatus = !exam.isActive;
        await this.updateExam(firebaseKey, { isActive: newStatus });
        return true;
      }
      return false;
    },

    async deleteExam(firebaseKey) {
      try {
        await firebaseDB.delete(DB_PATHS.EXAMS, firebaseKey);
        this.exams = this.exams.filter((e) => e.firebaseKey !== firebaseKey);
        return true;
      } catch (error) {
        console.error("Error deleting exam:", error);
        throw error;
      }
    },

    // توليد أسئلة عشوائية للامتحان
    getRandomizedQuestions(examId) {
      const exam = this.exams.find(
        (e) => e.firebaseKey === examId || e.id === examId
      );
      if (!exam) return [];

      const shuffled = [...exam.questions].sort(() => Math.random() - 0.5);

      return shuffled.map((q) => {
        if (q.type === "multiple" && q.options) {
          const shuffledOptions = [...q.options].sort(
            () => Math.random() - 0.5
          );
          return { ...q, options: shuffledOptions };
        }
        return q;
      });
    },

    // بدء أو استكمال امتحان
    async startOrResumeExam(examId, studentEmail) {
      const key = `${examId}_${studentEmail}`;
      const existing = this.ongoingExams[key];

      if (existing) {
        const elapsedSeconds = Math.floor(
          (Date.now() - existing.startTime) / 1000
        );
        const remainingTime = existing.totalDuration - elapsedSeconds;

        if (remainingTime <= 0) {
          return { ...existing, timeRemaining: 0, expired: true };
        }

        return { ...existing, timeRemaining: remainingTime, expired: false };
      }

      const exam = this.exams.find(
        (e) => e.firebaseKey === examId || e.id === examId
      );
      if (!exam) return null;

      const questions = this.getRandomizedQuestions(examId);
      const newOngoing = {
        examId,
        studentEmail,
        questions,
        answers: {},
        currentQuestionIndex: 0,
        startTime: Date.now(),
        totalDuration: exam.duration * 60,
        timeRemaining: exam.duration * 60,
      };

      this.ongoingExams[key] = newOngoing;
      await this.saveOngoingExamsToFirebase();

      return { ...newOngoing, expired: false };
    },

    // تحديث حالة الامتحان الجاري
    async updateOngoingExam(examId, studentEmail, updates) {
      const key = `${examId}_${studentEmail}`;
      if (this.ongoingExams[key]) {
        this.ongoingExams[key] = { ...this.ongoingExams[key], ...updates };
        await this.saveOngoingExamsToFirebase();
      }
    },

    // حفظ الإجابة
    async saveAnswer(examId, studentEmail, questionId, answer) {
      const key = `${examId}_${studentEmail}`;
      if (this.ongoingExams[key]) {
        this.ongoingExams[key].answers[questionId] = answer;
        await this.saveOngoingExamsToFirebase();
      }
    },

    // حفظ السؤال الحالي
    async saveCurrentQuestion(examId, studentEmail, index) {
      const key = `${examId}_${studentEmail}`;
      if (this.ongoingExams[key]) {
        this.ongoingExams[key].currentQuestionIndex = index;
        await this.saveOngoingExamsToFirebase();
      }
    },

    // إنهاء الامتحان الجاري
    async finishOngoingExam(examId, studentEmail) {
      const key = `${examId}_${studentEmail}`;
      delete this.ongoingExams[key];
      await this.saveOngoingExamsToFirebase();
    },

    async submitExamResult(result) {
      try {
        const newResult = {
          id: Date.now().toString(),
          submittedAt: new Date().toISOString(),
          ...result,
        };

        // حفظ النتيجة أولاً
        const firebaseKey = await firebaseDB.post(DB_PATHS.RESULTS, newResult);
        const resultWithKey = { ...newResult, firebaseKey };
        this.results.push(resultWithKey);

        // محاولة حذف الامتحان الجاري (لكن لا نفشل إذا لم ينجح)
        try {
          await this.finishOngoingExam(result.examId, result.studentEmail);
        } catch (finishError) {
          console.warn(
            "Warning: Could not finish ongoing exam record:",
            finishError
          );
          // نستمر لأن النتيجة تم حفظها بنجاح
        }

        return resultWithKey;
      } catch (error) {
        console.error("Error submitting result:", error);
        throw error;
      }
    },

    async saveOngoingExamsToFirebase() {
      try {
        // حفظ كل الامتحانات الجارية دفعة واحدة
        const entries = Object.entries(this.ongoingExams);
        if (entries.length === 0) return;

        const savePromises = entries.map(([key, value]) =>
          firebaseDB.put(DB_PATHS.ONGOING_EXAMS, key, value)
        );
        await Promise.all(savePromises);
      } catch (error) {
        console.error("Error saving ongoing exams:", error);
        // لا نرمي الخطأ لتجنب كسر التطبيق
      }
    },

    // حفظ امتحان واحد فقط بدلاً من الكل
    async saveOneOngoingExam(examId, studentEmail) {
      try {
        const key = `${examId}_${studentEmail}`;
        const examData = this.ongoingExams[key];
        if (examData) {
          await firebaseDB.put(DB_PATHS.ONGOING_EXAMS, key, examData);
        }
      } catch (error) {
        console.error("Error saving ongoing exam:", error);
      }
    },

    // حذف نتيجة واحدة
    async deleteResult(firebaseKey) {
      try {
        await firebaseDB.delete(DB_PATHS.RESULTS, firebaseKey);
        this.results = this.results.filter(
          (r) => r.firebaseKey !== firebaseKey
        );
        return true;
      } catch (error) {
        console.error("Error deleting result:", error);
        throw error;
      }
    },

    // حذف جميع نتائج امتحان معين
    async deleteResultsByExam(examId) {
      try {
        const examResults = this.results.filter((r) => r.examId === examId);
        for (const result of examResults) {
          if (result.firebaseKey) {
            await firebaseDB.delete(DB_PATHS.RESULTS, result.firebaseKey);
          }
        }
        this.results = this.results.filter((r) => r.examId !== examId);
        return true;
      } catch (error) {
        console.error("Error deleting exam results:", error);
        throw error;
      }
    },

    // حذف جميع نتائج طالب معين
    async deleteResultsByStudent(studentEmail) {
      try {
        const studentResults = this.results.filter(
          (r) => r.studentEmail === studentEmail
        );
        for (const result of studentResults) {
          if (result.firebaseKey) {
            await firebaseDB.delete(DB_PATHS.RESULTS, result.firebaseKey);
          }
        }
        this.results = this.results.filter(
          (r) => r.studentEmail !== studentEmail
        );
        return true;
      } catch (error) {
        console.error("Error deleting student results:", error);
        throw error;
      }
    },
  },
});
