<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-gray-800">
        إضافة اللينكات والصور
      </h1>

      <!-- نموذج إضافة لينك -->
      <div class="bg-white rounded-lg shadow-md p-8 mb-8">
        <form @submit.prevent="submitForm" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- اسم اللينك -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                اسم اللينك/الصورة
              </label>
              <input
                v-model="formData.title"
                type="text"
                placeholder="مثال: شرح الفصل الأول"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <!-- نوع اللينك -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                النوع
              </label>
              <select
                v-model="formData.type"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="link">رابط</option>
                <option value="image">صورة</option>
                <option value="video">فيديو</option>
              </select>
            </div>
          </div>

          <!-- الرابط/الصورة -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              {{ formData.type === "image" ? "رابط الصورة" : "الرابط" }}
            </label>
            <input
              v-model="formData.url"
              type="url"
              :placeholder="
                formData.type === 'image'
                  ? 'https://example.com/image.jpg'
                  : 'https://example.com'
              "
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <!-- الوصف -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              الوصف (اختياري)
            </label>
            <textarea
              v-model="formData.description"
              placeholder="أضف وصفاً للملف..."
              rows="4"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- المادة -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              المادة
            </label>
            <select
              v-model="formData.subject"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">اختر المادة</option>
              <option value="الفيزياء">الفيزياء</option>
              <option value="الكيمياء">الكيمياء</option>
              <option value="الأحياء">الأحياء</option>
              <option value="الرياضيات">الرياضيات</option>
            </select>
          </div>

          <!-- زر الإضافة -->
          <div class="flex gap-4">
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {{ loading ? "جاري الإضافة..." : "إضافة اللينك" }}
            </button>
            <button
              type="button"
              @click="resetForm"
              class="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
            >
              مسح
            </button>
          </div>

          <!-- رسالة الخطأ -->
          <div
            v-if="error"
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
          >
            {{ error }}
          </div>

          <!-- رسالة النجاح -->
          <div
            v-if="successMessage"
            class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"
          >
            {{ successMessage }}
          </div>
        </form>
      </div>

      <!-- قائمة اللينكات -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">اللينكات المضافة</h2>

        <div v-if="loading" class="text-center py-8 text-gray-600">
          جاري التحميل...
        </div>

        <div
          v-else-if="linksStore.links.length === 0"
          class="text-center py-8 text-gray-600"
        >
          لم تضف أي لينكات حتى الآن
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="link in linksStore.links"
            :key="link.id"
            class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
          >
            <!-- معاينة الصورة -->
            <div v-if="link.type === 'image'" class="mb-4">
              <img
                :src="link.url"
                :alt="link.title"
                class="w-full h-48 object-cover rounded-lg"
                @error="(e) => (e.target.style.display = 'none')"
              />
            </div>

            <!-- العنوان -->
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              {{ link.title }}
            </h3>

            <!-- النوع والمادة -->
            <div class="flex gap-2 mb-3">
              <span
                class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold"
              >
                {{
                  link.type === "link"
                    ? "رابط"
                    : link.type === "image"
                    ? "صورة"
                    : "فيديو"
                }}
              </span>
              <span
                class="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"
              >
                {{ link.subject }}
              </span>
            </div>

            <!-- الوصف -->
            <p v-if="link.description" class="text-gray-600 text-sm mb-4">
              {{ link.description }}
            </p>

            <!-- الرابط -->
            <a
              :href="link.url"
              target="_blank"
              class="text-blue-600 hover:text-blue-800 text-sm font-semibold mb-4 block truncate"
            >
              فتح الرابط
            </a>

            <!-- التاريخ والزر -->
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-500">
                {{ formatDate(link.createdAt) }}
              </span>
              <button
                @click="deleteLink(link.id)"
                class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useLinksStore } from "@/store/linksStore";
import { useAuthStore } from "@/store/authStore";

const linksStore = useLinksStore();
const authStore = useAuthStore();

const loading = ref(false);
const error = ref(null);
const successMessage = ref(null);

const formData = reactive({
  title: "",
  url: "",
  type: "link",
  description: "",
  subject: "",
  teacherId: authStore.user?.uid,
});

const submitForm = async () => {
  error.value = null;
  successMessage.value = null;

  if (!formData.title || !formData.url || !formData.subject) {
    error.value = "يرجى ملء جميع الحقول المطلوبة";
    return;
  }

  loading.value = true;
  try {
    await linksStore.addLink({
      ...formData,
      teacherId: authStore.user?.uid,
    });

    successMessage.value = "تم إضافة اللينك بنجاح!";
    resetForm();
    await linksStore.fetchLinks();
  } catch (err) {
    error.value = "حدث خطأ أثناء إضافة اللينك";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  formData.title = "";
  formData.url = "";
  formData.type = "link";
  formData.description = "";
  formData.subject = "";
  successMessage.value = null;
};

const deleteLink = async (linkId) => {
  if (confirm("هل أنت متأكد من حذف هذا اللينك؟")) {
    try {
      await linksStore.deleteLink(linkId);
      successMessage.value = "تم حذف اللينك بنجاح!";
    } catch (err) {
      error.value = "حدث خطأ أثناء حذف اللينك";
    }
  }
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// جلب اللينكات عند التحميل
linksStore.fetchLinks();
</script>
