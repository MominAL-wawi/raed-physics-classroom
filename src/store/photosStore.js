import { defineStore } from "pinia";
import { firebaseDB, DB_PATHS } from "../firebase/config";

export const usePhotosStore = defineStore("photos", {
  state: () => ({
    photos: [],
    isLoading: false,
  }),

  getters: {
    getAllPhotos: (state) => state.photos,
    getPhotoById: (state) => (id) =>
      state.photos.find((p) => p.firebaseKey === id || p.id === id),
    getPhotosByCategory: (state) => (category) =>
      state.photos.filter((p) => p.category === category),
  },

  actions: {
    // تحميل الصور من Firebase
    async loadPhotos() {
      this.isLoading = true;
      try {
        const data = await firebaseDB.get(DB_PATHS.PHOTOS);
        this.photos = firebaseDB.objectToArray(data);
      } catch (error) {
        console.error("Error loading photos:", error);
      } finally {
        this.isLoading = false;
      }
    },

    async addPhoto(photo) {
      try {
        const newPhoto = {
          id: Date.now().toString(),
          uploadedAt: new Date().toISOString(),
          ...photo,
        };
        const firebaseKey = await firebaseDB.post(DB_PATHS.PHOTOS, newPhoto);
        const photoWithKey = { ...newPhoto, firebaseKey };
        this.photos.push(photoWithKey);
        return photoWithKey;
      } catch (error) {
        console.error("Error adding photo:", error);
        throw error;
      }
    },

    async updatePhoto(firebaseKey, updates) {
      try {
        await firebaseDB.patch(DB_PATHS.PHOTOS, firebaseKey, updates);
        const index = this.photos.findIndex(
          (p) => p.firebaseKey === firebaseKey
        );
        if (index !== -1) {
          this.photos[index] = { ...this.photos[index], ...updates };
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error updating photo:", error);
        throw error;
      }
    },

    async deletePhoto(firebaseKey) {
      try {
        await firebaseDB.delete(DB_PATHS.PHOTOS, firebaseKey);
        this.photos = this.photos.filter((p) => p.firebaseKey !== firebaseKey);
        return true;
      } catch (error) {
        console.error("Error deleting photo:", error);
        throw error;
      }
    },
  },
});
