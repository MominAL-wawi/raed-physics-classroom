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
    getActiveExams: (state) => state.exams.filter((e) => e.isActive),
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
        const firebaseKey = await firebaseDB.post(DB_PATHS.RESULTS, newResult);
        const resultWithKey = { ...newResult, firebaseKey };
        this.results.push(resultWithKey);

        await this.finishOngoingExam(result.examId, result.studentEmail);

        return resultWithKey;
      } catch (error) {
        console.error("Error submitting result:", error);
        throw error;
      }
    },

    async saveOngoingExamsToFirebase() {
      try {
        // حفظ كل امتحان جاري بشكل منفصل
        for (const [key, value] of Object.entries(this.ongoingExams)) {
          await firebaseDB.put(DB_PATHS.ONGOING_EXAMS, key, value);
        }
      } catch (error) {
        console.error("Error saving ongoing exams:", error);
      }
    },
  },
});
