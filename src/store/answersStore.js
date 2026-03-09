import { defineStore } from "pinia";
import { firebaseDB, DB_PATHS } from "../firebase/config";

export const useAnswersStore = defineStore("answers", {
  state: () => ({
    answers: [],
    isLoading: false,
  }),

  getters: {
    getAllAnswers: (state) => state.answers,
    getAnswersByQuestion: (state) => (questionId) =>
      state.answers.filter((a) => a.questionId === questionId),
    getAnswersByStudent: (state) => (studentEmail) =>
      state.answers.filter((a) => a.studentEmail === studentEmail),
    getAnswersByExam: (state) => (examId) =>
      state.answers.filter((a) => a.examId === examId),
  },

  actions: {
    // تحميل الإجابات من Firebase
    async loadAnswers() {
      this.isLoading = true;
      try {
        const data = await firebaseDB.get(DB_PATHS.ANSWERS);
        this.answers = firebaseDB.objectToArray(data);
      } catch (error) {
        console.error("Error loading answers:", error);
      } finally {
        this.isLoading = false;
      }
    },

    async addAnswer(answer) {
      try {
        const newAnswer = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          ...answer,
        };
        const firebaseKey = await firebaseDB.post(DB_PATHS.ANSWERS, newAnswer);
        const answerWithKey = { ...newAnswer, firebaseKey };
        this.answers.push(answerWithKey);
        return answerWithKey;
      } catch (error) {
        console.error("Error adding answer:", error);
        throw error;
      }
    },

    async updateAnswer(firebaseKey, updates) {
      try {
        await firebaseDB.patch(DB_PATHS.ANSWERS, firebaseKey, updates);
        const index = this.answers.findIndex(
          (a) => a.firebaseKey === firebaseKey
        );
        if (index !== -1) {
          this.answers[index] = { ...this.answers[index], ...updates };
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error updating answer:", error);
        throw error;
      }
    },

    async deleteAnswer(firebaseKey) {
      try {
        await firebaseDB.delete(DB_PATHS.ANSWERS, firebaseKey);
        this.answers = this.answers.filter(
          (a) => a.firebaseKey !== firebaseKey
        );
        return true;
      } catch (error) {
        console.error("Error deleting answer:", error);
        throw error;
      }
    },

    // حذف إجابات امتحان معين
    async deleteAnswersByExam(examId) {
      try {
        const examAnswers = this.answers.filter((a) => a.examId === examId);
        for (const answer of examAnswers) {
          await firebaseDB.delete(DB_PATHS.ANSWERS, answer.firebaseKey);
        }
        this.answers = this.answers.filter((a) => a.examId !== examId);
        return true;
      } catch (error) {
        console.error("Error deleting exam answers:", error);
        throw error;
      }
    },
  },
});
