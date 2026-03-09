<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-6xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">الطلاب</h1>
        <p class="text-gray-600">عرض وإدارة الطلاب المسجلين معك</p>
      </div>

      <!-- Search and Filter -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="البحث عن طالب..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            @click="resetSearch"
            class="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            مسح البحث
          </button>
        </div>
      </div>

      <!-- Students Grid -->
      <div v-if="loading" class="text-center py-12 text-gray-600">
        جاري التحميل...
      </div>

      <div v-else-if="filteredStudents.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">📚</div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">لا توجد نتائج</h3>
        <p class="text-gray-600">لم يتم العثور على طلاب</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="student in filteredStudents"
          :key="student.firebaseKey"
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <!-- Student Avatar -->
          <div class="flex items-center justify-between mb-4">
            <div
              class="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold"
            >
              {{ student.name.charAt(0) }}
            </div>
            <span
              class="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold"
            >
              طالب
            </span>
          </div>

          <!-- Student Info -->
          <h3 class="text-lg font-semibold text-gray-800 mb-2">
            {{ student.name }}
          </h3>

          <div class="space-y-2 mb-4 text-sm text-gray-600">
            <div class="flex items-center">
              <i class="bi bi-envelope text-blue-500 ml-2"></i>
              {{ student.email }}
            </div>
            <div class="flex items-center">
              <i class="bi bi-key text-blue-500 ml-2"></i>
              <code class="bg-gray-100 px-2 py-1 rounded">{{
                student.password
              }}</code>
            </div>
            <div v-if="student.createdAt" class="flex items-center">
              <i class="bi bi-calendar text-blue-500 ml-2"></i>
              {{ formatDate(student.createdAt) }}
            </div>
          </div>

          <!-- Status -->
          <div class="border-t border-gray-200 pt-4">
            <div class="flex items-center text-sm text-green-600">
              <i class="bi bi-check-circle-fill mr-2"></i>
              نشط
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div
        v-if="filteredStudents.length > 0"
        class="mt-8 bg-white rounded-lg shadow-md p-6"
      >
        <h3 class="text-lg font-semibold text-gray-800 mb-4">إحصائيات</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600 mb-2">
              {{ filteredStudents.length }}
            </div>
            <p class="text-gray-600">إجمالي الطلاب</p>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600 mb-2">
              {{ filteredStudents.length }}
            </div>
            <p class="text-gray-600">الطلاب النشطين</p>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600 mb-2">
              {{ todayStudents }}
            </div>
            <p class="text-gray-600">أُضيفوا اليوم</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/store/authStore";

const authStore = useAuthStore();
const searchQuery = ref("");
const loading = ref(true);

const filteredStudents = computed(() => {
  if (!searchQuery.value) {
    return authStore.students;
  }

  const query = searchQuery.value.toLowerCase();
  return authStore.students.filter(
    (student) =>
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query)
  );
});

const todayStudents = computed(() => {
  const today = new Date().toDateString();
  return authStore.students.filter((student) => {
    if (!student.createdAt) return false;
    return new Date(student.createdAt).toDateString() === today;
  }).length;
});

const resetSearch = () => {
  searchQuery.value = "";
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(async () => {
  loading.value = true;
  try {
    await authStore.loadStudents();
  } catch (error) {
    console.error("خطأ في تحميل الطلاب:", error);
  } finally {
    loading.value = false;
  }
});
</script>
