// Firebase Realtime Database Configuration
const DATABASE_URL = "https://studyphysics-bd79d-default-rtdb.firebaseio.com/";

// Database paths
export const DB_PATHS = {
  STUDENTS: "/Student",
  TEACHERS: "/Teacher",
  ADMIN: "/admin",
  ANSWERS: "/answers",
  EXAMS: "/exams",
  FILES: "/files",
  QUESTIONS: "/questions",
  RESULTS: "/results",
  PHOTOS: "/photo",
  ONGOING_EXAMS: "/ongoingExams",
};

// Helper function to build full URL
const buildUrl = (path, key = "") => {
  const suffix = key ? `/${key}.json` : ".json";
  return `${DATABASE_URL}${path}${suffix}`;
};

// Firebase Realtime Database API functions
export const firebaseDB = {
  // GET - Read data
  async get(path, key = "") {
    try {
      const url = buildUrl(path, key);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Firebase GET error:", error);
      throw error;
    }
  },

  // POST - Create new data with auto-generated key
  async post(path, data) {
    console.log("[v0] Firebase POST starting:", path);
    try {
      const url = buildUrl(path);
      console.log("[v0] Firebase POST URL:", url);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      console.log("[v0] Firebase POST response status:", response.status);
      if (!response.ok) throw new Error("Failed to create data");
      const result = await response.json();
      console.log("[v0] Firebase POST result:", result);
      return result.name; // Returns the generated key
    } catch (error) {
      console.error("[v0] Firebase POST error:", error);
      throw error;
    }
  },

  // PUT - Create/Update data with specific key
  async put(path, key, data) {
    try {
      const url = buildUrl(path, key);
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update data");
      return await response.json();
    } catch (error) {
      console.error("Firebase PUT error:", error);
      throw error;
    }
  },

  // PATCH - Update specific fields
  async patch(path, key, data) {
    try {
      const url = buildUrl(path, key);
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to patch data");
      return await response.json();
    } catch (error) {
      console.error("Firebase PATCH error:", error);
      throw error;
    }
  },

  // DELETE - Remove data
  async delete(path, key) {
    try {
      const url = buildUrl(path, key);
      const response = await fetch(url, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete data");
      return true;
    } catch (error) {
      console.error("Firebase DELETE error:", error);
      throw error;
    }
  },

  // Helper: Convert Firebase object to array with keys
  objectToArray(obj) {
    if (!obj) return [];
    return Object.entries(obj).map(([key, value]) => ({
      ...value,
      firebaseKey: key,
    }));
  },
};

export default firebaseDB;
