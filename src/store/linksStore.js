import { defineStore } from "pinia";
import { ref } from "vue";
import { database } from "@/firebase/config";
import { ref as dbRef, push, remove, get } from "firebase/database";

export const useLinksStore = defineStore("links", () => {
  const links = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchLinks = async () => {
    loading.value = true;
    error.value = null;
    try {
      const linksRef = dbRef(database, "links");
      const snapshot = await get(linksRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        links.value = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
          createdAt: new Date(value.createdAt),
        }));
      } else {
        links.value = [];
      }
    } catch (err) {
      console.error("خطأ في جلب اللينكات:", err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const addLink = async (linkData) => {
    loading.value = true;
    error.value = null;
    try {
      const linksRef = dbRef(database, "links");
      const newLinkRef = push(linksRef);

      const dataToAdd = {
        ...linkData,
        createdAt: new Date().toISOString(),
        createdBy: linkData.teacherId,
      };

      await newLinkRef.set(dataToAdd);

      return {
        id: newLinkRef.key,
        ...dataToAdd,
      };
    } catch (err) {
      console.error("خطأ في إضافة اللينك:", err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteLink = async (linkId) => {
    loading.value = true;
    error.value = null;
    try {
      const linkRef = dbRef(database, `links/${linkId}`);
      await remove(linkRef);
      links.value = links.value.filter((link) => link.id !== linkId);
    } catch (err) {
      console.error("خطأ في حذف اللينك:", err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    links,
    loading,
    error,
    fetchLinks,
    addLink,
    deleteLink,
  };
});
