import { defineStore } from "pinia";
import { firebaseDB, DB_PATHS } from "../firebase/config";

export const useFilesStore = defineStore("files", {
  state: () => ({
    files: [],
    isLoading: false,
  }),

  getters: {
    getAllFiles: (state) => state.files,
    getPdfFiles: (state) => state.files.filter((f) => f.type === "pdf"),
    getImageFiles: (state) => state.files.filter((f) => f.type === "image"),
  },

  actions: {
    // تحميل الملفات من Firebase
    async loadFiles() {
      this.isLoading = true;
      try {
        const data = await firebaseDB.get(DB_PATHS.FILES);
        this.files = firebaseDB.objectToArray(data);
      } catch (error) {
        console.error("Error loading files:", error);
      } finally {
        this.isLoading = false;
      }
    },

    async addFile(file) {
      try {
        const newFile = {
          id: Date.now().toString(),
          uploadedAt: new Date().toISOString(),
          ...file,
        };
        const firebaseKey = await firebaseDB.post(DB_PATHS.FILES, newFile);
        const fileWithKey = { ...newFile, firebaseKey };
        this.files.push(fileWithKey);
        return fileWithKey;
      } catch (error) {
        console.error("Error adding file:", error);
        throw error;
      }
    },

    async updateFile(firebaseKey, updates) {
      try {
        await firebaseDB.patch(DB_PATHS.FILES, firebaseKey, updates);
        const index = this.files.findIndex(
          (f) => f.firebaseKey === firebaseKey
        );
        if (index !== -1) {
          this.files[index] = { ...this.files[index], ...updates };
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error updating file:", error);
        throw error;
      }
    },

    async deleteFile(firebaseKey) {
      try {
        await firebaseDB.delete(DB_PATHS.FILES, firebaseKey);
        this.files = this.files.filter((f) => f.firebaseKey !== firebaseKey);
        return true;
      } catch (error) {
        console.error("Error deleting file:", error);
        throw error;
      }
    },
  },
});
