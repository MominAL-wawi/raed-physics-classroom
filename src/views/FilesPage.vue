<template>
  <div class="dashboard-container">
    <div class="container">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2><i class="bi bi-folder me-2"></i>الملفات</h2>
        <button
          v-if="isTeacher"
          class="btn btn-primary-custom"
          data-bs-toggle="modal"
          data-bs-target="#uploadModal"
        >
          <i class="bi bi-upload me-2"></i>
          رفع ملف
        </button>
      </div>

      <!-- فلتر الملفات -->
      <div class="section-card mb-4">
        <div class="card-body">
          <div class="btn-group">
            <button
              class="btn"
              :class="filter === 'all' ? 'btn-primary' : 'btn-outline-primary'"
              @click="filter = 'all'"
            >
              الكل ({{ filesStore.files.length }})
            </button>
            <button
              class="btn"
              :class="filter === 'pdf' ? 'btn-primary' : 'btn-outline-primary'"
              @click="filter = 'pdf'"
            >
              <i class="bi bi-file-pdf me-1"></i>
              PDF ({{ filesStore.getPdfFiles.length }})
            </button>
            <button
              class="btn"
              :class="
                filter === 'image' ? 'btn-primary' : 'btn-outline-primary'
              "
              @click="filter = 'image'"
            >
              <i class="bi bi-file-image me-1"></i>
              صور ({{ filesStore.getImageFiles.length }})
            </button>
          </div>
        </div>
      </div>

      <!-- قائمة الملفات -->
      <div v-if="filteredFiles.length === 0" class="section-card">
        <div class="card-body">
          <div class="empty-state">
            <i class="bi bi-folder-x"></i>
            <h4>لا توجد ملفات</h4>
            <p v-if="isTeacher">ابدأ برفع الملفات للطلاب</p>
          </div>
        </div>
      </div>

      <div v-else class="row">
        <div v-for="file in filteredFiles" :key="file.id" class="col-md-6 mb-3">
          <FileCard
            :file="file"
            :show-delete="isTeacher"
            @delete="deleteFile"
          />
        </div>
      </div>

      <!-- Modal رفع ملف -->
      <div class="modal fade" id="uploadModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">رفع ملف جديد</h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="uploadFile">
                <div class="mb-3">
                  <label class="form-label">اسم الملف</label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="uploadForm.name"
                    required
                    placeholder="أدخل اسم الملف"
                  />
                </div>

                <div class="mb-3">
                  <label class="form-label">نوع الملف</label>
                  <div class="btn-group w-100">
                    <button
                      type="button"
                      class="btn"
                      :class="
                        uploadForm.type === 'pdf'
                          ? 'btn-danger'
                          : 'btn-outline-danger'
                      "
                      @click="uploadForm.type = 'pdf'"
                    >
                      <i class="bi bi-file-pdf me-2"></i>
                      PDF
                    </button>
                    <button
                      type="button"
                      class="btn"
                      :class="
                        uploadForm.type === 'image'
                          ? 'btn-success'
                          : 'btn-outline-success'
                      "
                      @click="uploadForm.type = 'image'"
                    >
                      <i class="bi bi-file-image me-2"></i>
                      صورة
                    </button>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">اختر الملف</label>
                  <input
                    type="file"
                    class="form-control"
                    @change="handleFileSelect"
                    :accept="uploadForm.type === 'pdf' ? '.pdf' : 'image/*'"
                    required
                  />
                </div>

                <div
                  v-if="uploadForm.preview && uploadForm.type === 'image'"
                  class="mb-3"
                >
                  <img
                    :src="uploadForm.preview"
                    class="img-fluid rounded"
                    style="max-height: 200px"
                  />
                </div>

                <div class="modal-footer px-0 pb-0">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    إلغاء
                  </button>
                  <button type="submit" class="btn btn-primary-custom">
                    <i class="bi bi-upload me-2"></i>
                    رفع الملف
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/store/authStore";
import { useFilesStore } from "@/store/filesStore";
import FileCard from "@/components/FileCard.vue";
import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap";
export default {
  name: "FilesPage",
  components: { FileCard },
  setup() {
    const authStore = useAuthStore();
    const filesStore = useFilesStore();

    // تحميل البيانات من Firebase عند تحميل الصفحة
    onMounted(async () => {
      await filesStore.loadFiles();
    });

    const filter = ref("all");
    const uploadForm = ref({
      name: "",
      type: "pdf",
      url: "",
      preview: "",
    });

    const isTeacher = computed(() => authStore.user?.role === "teacher");

    const filteredFiles = computed(() => {
      if (filter.value === "all") return filesStore.files;
      return filesStore.files.filter((f) => f.type === filter.value);
    });

    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadForm.value.url = e.target.result;
          if (uploadForm.value.type === "image") {
            uploadForm.value.preview = e.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    };

    const uploadFile = async () => {
      try {
        await filesStore.addFile({
          name: uploadForm.value.name,
          type: uploadForm.value.type,
          url: uploadForm.value.url,
        });

        // إغلاق Modal وإعادة تعيين النموذج
        const modal = document.getElementById("uploadModal");
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        bootstrapModal.hide();

        uploadForm.value = {
          name: "",
          type: "pdf",
          url: "",
          preview: "",
        };
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    };

    const deleteFile = async (firebaseKey) => {
      if (confirm("هل أنت متأكد من حذف هذا الملف؟")) {
        await filesStore.deleteFile(firebaseKey);
      }
    };

    return {
      filesStore,
      filter,
      uploadForm,
      isTeacher,
      filteredFiles,
      handleFileSelect,
      uploadFile,
      deleteFile,
    };
  },
};
</script>
