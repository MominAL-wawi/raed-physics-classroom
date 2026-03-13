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
            <button
              class="btn"
              :class="filter === 'link' ? 'btn-primary' : 'btn-outline-primary'"
              @click="filter = 'link'"
            >
              <i class="bi bi-link-45deg me-1"></i>
              روابط ({{ filesStore.getLinkFiles.length }})
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
        <div
          v-for="file in filteredFiles"
          :key="file.firebaseKey || file.id"
          class="col-md-6 mb-3"
        >
          <FileCard
            :file="file"
            :show-delete="isTeacher"
            @delete="deleteFile"
          />
        </div>
      </div>

      <!-- Modal رفع ملف - محسّن -->
      <div class="modal fade" id="uploadModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">
                <i class="bi bi-cloud-upload me-2"></i>
                رفع محتوى جديد
              </h5>
              <button
                type="button"
                class="btn-close btn-close-white"
                data-bs-dismiss="modal"
              ></button>
            </div>
            <div class="modal-body p-4">
              <!-- اختيار نوع المحتوى بشكل بصري -->
              <div class="upload-type-selector mb-4">
                <div class="row g-3">
                  <div class="col-4">
                    <div
                      class="upload-type-card"
                      :class="{ active: uploadForm.type === 'pdf' }"
                      @click="selectUploadType('pdf')"
                    >
                      <i class="bi bi-file-pdf text-danger"></i>
                      <span>ملف PDF</span>
                    </div>
                  </div>
                  <div class="col-4">
                    <div
                      class="upload-type-card"
                      :class="{ active: uploadForm.type === 'image' }"
                      @click="selectUploadType('image')"
                    >
                      <i class="bi bi-file-image text-success"></i>
                      <span>صورة</span>
                    </div>
                  </div>
                  <div class="col-4">
                    <div
                      class="upload-type-card"
                      :class="{ active: uploadForm.type === 'link' }"
                      @click="selectUploadType('link')"
                    >
                      <i class="bi bi-link-45deg text-primary"></i>
                      <span>رابط</span>
                    </div>
                  </div>
                </div>
              </div>

              <form @submit.prevent="uploadFile">
                <!-- منطقة السحب والإفلات للملفات -->
                <div
                  v-if="uploadForm.type !== 'link'"
                  class="drop-zone mb-3"
                  :class="{
                    'drag-over': isDragging,
                    'has-file': uploadForm.file,
                  }"
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @drop.prevent="handleDrop"
                  @click="$refs.fileInput.click()"
                >
                  <input
                    ref="fileInput"
                    type="file"
                    class="d-none"
                    @change="handleFileSelect"
                    :accept="uploadForm.type === 'pdf' ? '.pdf' : 'image/*'"
                  />

                  <div v-if="!uploadForm.file" class="drop-zone-content">
                    <i class="bi bi-cloud-arrow-up"></i>
                    <p>اسحب الملف هنا أو انقر للاختيار</p>
                    <small class="text-muted">
                      {{
                        uploadForm.type === "pdf"
                          ? "ملفات PDF فقط"
                          : "صور (JPG, PNG, GIF)"
                      }}
                    </small>
                  </div>

                  <div v-else class="selected-file">
                    <i
                      :class="
                        uploadForm.type === 'pdf'
                          ? 'bi bi-file-pdf text-danger'
                          : 'bi bi-file-image text-success'
                      "
                    ></i>
                    <div class="file-info">
                      <strong>{{ uploadForm.fileName }}</strong>
                      <small>{{ formatFileSize(uploadForm.fileSize) }}</small>
                    </div>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      @click.stop="clearFile"
                    >
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                </div>

                <!-- معاينة الصورة -->
                <div
                  v-if="uploadForm.preview && uploadForm.type === 'image'"
                  class="image-preview mb-3"
                >
                  <img :src="uploadForm.preview" class="img-fluid rounded" />
                </div>

                <!-- حقل الرابط -->
                <div v-if="uploadForm.type === 'link'" class="mb-3">
                  <div class="input-group input-group-lg">
                    <span class="input-group-text">
                      <i class="bi bi-link-45deg"></i>
                    </span>
                    <input
                      type="url"
                      class="form-control"
                      v-model="uploadForm.linkUrl"
                      placeholder="https://example.com/video"
                      dir="ltr"
                    />
                  </div>
                  <small class="text-muted"
                    >يمكنك إضافة روابط يوتيوب، جوجل درايف، أو أي رابط آخر</small
                  >
                </div>

                <!-- اسم الملف / العنوان -->
                <div class="mb-3">
                  <label class="form-label">
                    <i class="bi bi-tag me-1"></i>
                    {{
                      uploadForm.type === "link" ? "عنوان الرابط" : "اسم الملف"
                    }}
                  </label>
                  <input
                    type="text"
                    class="form-control"
                    v-model="uploadForm.name"
                    :placeholder="
                      uploadForm.type === 'link'
                        ? 'مثال: فيديو شرح الفصل الأول'
                        : 'مثال: ملخص الفصل الأول'
                    "
                  />
                  <small class="text-muted"
                    >اتركه فارغاً لاستخدام اسم الملف الأصلي</small
                  >
                </div>

                <div class="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    class="btn btn-light"
                    data-bs-dismiss="modal"
                    :disabled="isUploading"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    class="btn btn-primary btn-lg"
                    :disabled="isUploading || !canUpload"
                  >
                    <span
                      v-if="isUploading"
                      class="spinner-border spinner-border-sm me-2"
                    ></span>
                    <i v-else class="bi bi-cloud-check me-2"></i>
                    {{ isUploading ? "جاري الرفع..." : "رفع المحتوى" }}
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
import { firebaseDB } from "@/firebase/config";
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
    const isDragging = ref(false);
    const uploadForm = ref({
      name: "",
      type: "pdf",
      url: "",
      preview: "",
      linkUrl: "",
      file: null,
      fileName: "",
      fileSize: 0,
    });

    const isTeacher = computed(() => authStore.user?.role === "teacher");

    const filteredFiles = computed(() => {
      if (filter.value === "all") return filesStore.files;
      return filesStore.files.filter((f) => f.type === filter.value);
    });

    // التحقق من إمكانية الرفع
    const canUpload = computed(() => {
      if (uploadForm.value.type === "link") {
        return (
          uploadForm.value.linkUrl && uploadForm.value.linkUrl.trim() !== ""
        );
      }
      return uploadForm.value.file !== null;
    });

    // اختيار نوع الرفع
    const selectUploadType = (type) => {
      uploadForm.value.type = type;
      clearFile();
    };

    // تنسيق حجم الملف
    const formatFileSize = (bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // معالجة السحب والإفلات
    const handleDrop = (event) => {
      isDragging.value = false;
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    };

    // معالجة اختيار الملف
    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
        processFile(file);
      }
    };

    // معالجة الملف
    const processFile = (file) => {
      // التحقق من نوع الملف
      if (uploadForm.value.type === "pdf" && !file.type.includes("pdf")) {
        alert("يرجى اختيار ملف PDF");
        return;
      }
      if (
        uploadForm.value.type === "image" &&
        !file.type.startsWith("image/")
      ) {
        alert("يرجى اختيار ملف صورة");
        return;
      }

      uploadForm.value.file = file;
      uploadForm.value.fileName = file.name;
      uploadForm.value.fileSize = file.size;

      // تعيين اسم افتراضي من اسم الملف
      if (!uploadForm.value.name) {
        uploadForm.value.name = file.name.replace(/\.[^/.]+$/, "");
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        uploadForm.value.url = e.target.result;
        if (uploadForm.value.type === "image") {
          uploadForm.value.preview = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    };

    // مسح الملف المحدد
    const clearFile = () => {
      uploadForm.value.file = null;
      uploadForm.value.fileName = "";
      uploadForm.value.fileSize = 0;
      uploadForm.value.url = "";
      uploadForm.value.preview = "";
    };

    const isUploading = ref(false);

    const closeModal = () => {
      const modalEl = document.getElementById("uploadModal");
      if (modalEl) {
        const bootstrapModal = bootstrap.Modal.getInstance(modalEl);
        if (bootstrapModal) {
          bootstrapModal.hide();
        }
        setTimeout(() => {
          const backdrop = document.querySelector(".modal-backdrop");
          if (backdrop) {
            backdrop.remove();
          }
          document.body.classList.remove("modal-open");
          document.body.style.overflow = "";
          document.body.style.paddingRight = "";
        }, 300);
      }
    };

    const uploadFile = async () => {
      if (isUploading.value || !canUpload.value) return;
      isUploading.value = true;

      try {
        // استخدام اسم الملف الأصلي إذا لم يُحدد اسم
        const fileName =
          uploadForm.value.name.trim() ||
          uploadForm.value.fileName ||
          "ملف بدون اسم";

        const fileData = {
          name: fileName,
          type: uploadForm.value.type,
          url:
            uploadForm.value.type === "link"
              ? uploadForm.value.linkUrl
              : uploadForm.value.url,
        };

        // حفظ اللينك في مسار links بالإضافة إلى files
        if (uploadForm.value.type === "link") {
          await firebaseDB.post("/links", {
            title: fileName,
            url: uploadForm.value.linkUrl,
            createdAt: new Date().toISOString(),
          });
        }

        await filesStore.addFile(fileData);

        // إغلاق Modal
        closeModal();

        // إعادة تعيين النموذج
        uploadForm.value = {
          name: "",
          type: "pdf",
          url: "",
          preview: "",
          linkUrl: "",
          file: null,
          fileName: "",
          fileSize: 0,
        };
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("حدث خطأ أثناء رفع الملف. يرجى المحاولة مرة أخرى.");
      } finally {
        isUploading.value = false;
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
      isUploading,
      isDragging,
      canUpload,
      selectUploadType,
      formatFileSize,
      handleDrop,
      handleFileSelect,
      clearFile,
      uploadFile,
      deleteFile,
    };
  },
};
</script>

<style scoped>
/* أنماط اختيار نوع الرفع */
.upload-type-card {
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-type-card:hover {
  border-color: #4361ee;
  background: rgba(67, 97, 238, 0.05);
}

.upload-type-card.active {
  border-color: #4361ee;
  background: rgba(67, 97, 238, 0.1);
}

.upload-type-card i {
  font-size: 2rem;
  display: block;
  margin-bottom: 8px;
}

.upload-type-card span {
  font-weight: 600;
  color: #495057;
}

/* منطقة السحب والإفلات */
.drop-zone {
  border: 2px dashed #dee2e6;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f8f9fa;
}

.drop-zone:hover,
.drop-zone.drag-over {
  border-color: #4361ee;
  background: rgba(67, 97, 238, 0.05);
}

.drop-zone.has-file {
  border-style: solid;
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.05);
}

.drop-zone-content i {
  font-size: 3rem;
  color: #adb5bd;
  margin-bottom: 15px;
  display: block;
}

.drop-zone-content p {
  font-size: 1.1rem;
  color: #495057;
  margin-bottom: 5px;
}

/* الملف المحدد */
.selected-file {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
}

.selected-file i {
  font-size: 2.5rem;
}

.selected-file .file-info {
  flex: 1;
  text-align: right;
}

.selected-file .file-info strong {
  display: block;
  color: #212529;
}

.selected-file .file-info small {
  color: #6c757d;
}

/* معاينة الصورة */
.image-preview {
  text-align: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.image-preview img {
  max-height: 200px;
  border-radius: 8px;
}
</style>
