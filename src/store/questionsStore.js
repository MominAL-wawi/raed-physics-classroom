import { defineStore } from "pinia";
import { firebaseDB, DB_PATHS } from "../firebase/config";

export const useQuestionsStore = defineStore("questions", {
  state: () => ({
    questions: [],
    isLoading: false,
  }),

  getters: {
    getAllQuestions: (state) => state.questions,
    getMultipleChoiceQuestions: (state) =>
      state.questions.filter((q) => q.type === "multiple"),
    getTrueFalseQuestions: (state) =>
      state.questions.filter((q) => q.type === "truefalse"),
    getQuestionById: (state) => (id) =>
      state.questions.find((q) => q.firebaseKey === id || q.id === id),
  },

  actions: {
    // تحميل الأسئلة من Firebase
    async loadQuestions() {
      this.isLoading = true;
      try {
        const data = await firebaseDB.get(DB_PATHS.QUESTIONS);
        this.questions = firebaseDB.objectToArray(data);
      } catch (error) {
        console.error("Error loading questions:", error);
      } finally {
        this.isLoading = false;
      }
    },

    async addQuestion(question) {
      console.log("[v0] addQuestion called with:", question);
      try {
        const newQuestion = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          ...question,
        };
        console.log("[v0] Sending to Firebase:", newQuestion);
        const firebaseKey = await firebaseDB.post(
          DB_PATHS.QUESTIONS,
          newQuestion
        );
        console.log("[v0] Firebase returned key:", firebaseKey);
        const questionWithKey = { ...newQuestion, firebaseKey };
        this.questions.push(questionWithKey);
        console.log("[v0] Question added successfully");
        return questionWithKey;
      } catch (error) {
        console.error("[v0] Error adding question:", error);
        throw error;
      }
    },

    async updateQuestion(firebaseKey, updates) {
      try {
        await firebaseDB.patch(DB_PATHS.QUESTIONS, firebaseKey, updates);
        const index = this.questions.findIndex(
          (q) => q.firebaseKey === firebaseKey
        );
        if (index !== -1) {
          this.questions[index] = { ...this.questions[index], ...updates };
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error updating question:", error);
        throw error;
      }
    },

    async deleteQuestion(firebaseKey) {
      try {
        await firebaseDB.delete(DB_PATHS.QUESTIONS, firebaseKey);
        this.questions = this.questions.filter(
          (q) => q.firebaseKey !== firebaseKey
        );
        return true;
      } catch (error) {
        console.error("Error deleting question:", error);
        throw error;
      }
    },
  },
});
