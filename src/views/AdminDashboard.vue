<template>
  <div class="admin-dashboard">
    <div class="container py-4">
      <!-- Header -->
      <div class="dashboard-header mb-4">
        <h2 class="mb-1">لوحة تحكم المدير</h2>
        <p class="text-muted mb-0">إدارة حسابات الطلاب</p>
      </div>

      <!-- Stats Cards -->
      <div class="row g-4 mb-4">
        <div class="col-md-4">
          <div class="stats-card">
            <div class="icon primary">
              <i class="bi bi-people-fill"></i>
            </div>
            <h3>{{ students.length }}</h3>
            <p>إجمالي الطلاب</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stats-card">
            <div class="icon success">
              <i class="bi bi-person-check-fill"></i>
            </div>
            <h3>{{ students.length }}</h3>
            <p>الطلاب النشطين</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stats-card">
            <div class="icon warning">
              <i class="bi bi-clock-history"></i>
            </div>
            <h3>{{ todayStudents }}</h3>
            <p>أُضيفوا اليوم</p>
          </div>
        </div>
      </div>

      <!-- Students Management Section -->
      <div class="section-card">
        <div
          class="card-header d-flex justify-content-between align-items-center"
        >
          <h5 class="mb-0">
            <i class="bi bi-people me-2"></i>
            إدارة الطلاب
          </h5>
          <button class="btn btn-light btn-sm" @click="showAddModal = true">
            <i class="bi bi-plus-lg me-1"></i>
            إضافة طالب
          </button>
        </div>
        <div class="card-body">
          <!-- Search -->
          <div class="search-box mb-4">
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0">
                <i class="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                class="form-control border-start-0"
                placeholder="البحث عن طالب..."
                v-model="searchQuery"
              />
            </div>
          </div>

          <!-- Students Table -->
          <div v-if="filteredStudents.length > 0" class="table-responsive">
            <table class="table table-custom table-hover">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>رقم الهوية (كلمة السر)</th>
                  <th>تاريخ الإضافة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(student, index) in filteredStudents"
                  :key="student.id"
                >
                  <td>{{ index + 1 }}</td>
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="student-avatar me-2">
                        <i class="bi bi-person-fill"></i>
                      </div>
                      {{ student.name }}
                    </div>
                  </td>
                  <td>{{ student.email }}</td>
                  <td>
                    <code class="password-code">{{ student.password }}</code>
                  </td>
                  <td>{{ formatDate(student.createdAt) }}</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button
                        class="btn btn-outline-primary"
                        @click="editStudent(student)"
                      >
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button
                        class="btn btn-outline-danger"
                        @click="confirmDelete(student)"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <i class="bi bi-people"></i>
            <h4>لا يوجد طلاب</h4>
            <p>ابدأ بإضافة طلاب جدد للمنصة</p>
            <button class="btn btn-primary-custom" @click="showAddModal = true">
              <i class="bi bi-plus-lg me-2"></i>
              إضافة طالب
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Student Modal -->
    <div
      class="modal fade"
      :class="{ show: showAddModal }"
      :style="{ display: showAddModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-person-plus me-2"></i>
              {{ editMode ? "تعديل بيانات الطالب" : "إضافة طالب جديد" }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
            ></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveStudent">
              <div class="mb-3">
                <label class="form-label">اسم الطالب</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="studentForm.name"
                  placeholder="أدخل اسم الطالب"
                  required
                />
              </div>
              <div class="mb-3">
                <label class="form-label">البريد الإلكتروني</label>
                <input
                  type="email"
                  class="form-control"
                  v-model="studentForm.email"
                  placeholder="example@email.com"
                  required
                />
              </div>
              <div class="mb-3">
                <label class="form-label">رقم الهوية (كلمة السر)</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="studentForm.password"
                  placeholder="أدخل رقم الهوية"
                  required
                />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              إلغاء
            </button>
            <button
              type="button"
              class="btn btn-primary-custom"
              @click="saveStudent"
            >
              <i class="bi bi-check-lg me-1"></i>
              {{ editMode ? "حفظ التعديلات" : "إضافة الطالب" }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showAddModal" class="modal-backdrop fade show"></div>

    <!-- Delete Confirmation Modal -->
    <div
      class="modal fade"
      :class="{ show: showDeleteModal }"
      :style="{ display: showDeleteModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">
              <i class="bi bi-exclamation-triangle me-2"></i>
              تأكيد الحذف
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="showDeleteModal = false"
            ></button>
          </div>
          <div class="modal-body text-center py-4">
            <i class="bi bi-trash text-danger" style="font-size: 3rem"></i>
            <h5 class="mt-3">هل أنت متأكد من حذف هذا الطالب؟</h5>
            <p class="text-muted mb-0">{{ studentToDelete?.name }}</p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="showDeleteModal = false"
            >
              إلغاء
            </button>
            <button type="button" class="btn btn-danger" @click="deleteStudent">
              <i class="bi bi-trash me-1"></i>
              نعم، احذف
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showDeleteModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/store/authStore";

export default {
  name: "AdminDashboard",
  setup() {
    const authStore = useAuthStore();

    const students = ref([]);
    const searchQuery = ref("");
    const showAddModal = ref(false);
    const showDeleteModal = ref(false);
    const editMode = ref(false);
    const editingId = ref(null);
    const studentToDelete = ref(null);

    const studentForm = ref({
      name: "",
      email: "",
      password: "",
    });

    const filteredStudents = computed(() => {
      if (!searchQuery.value) return students.value;
      const query = searchQuery.value.toLowerCase();
      return students.value.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.password.includes(query)
      );
    });

    const todayStudents = computed(() => {
      const today = new Date().toDateString();
      return students.value.filter(
        (s) => new Date(s.createdAt).toDateString() === today
      ).length;
    });

    const loadStudents = async () => {
      await authStore.loadStudents();
      students.value = authStore.getStudents();
    };

    const formatDate = (dateString) => {
      if (!dateString) return "-";
      return new Date(dateString).toLocaleDateString("ar-SA");
    };

    const closeModal = () => {
      showAddModal.value = false;
      editMode.value = false;
      editingId.value = null;
      studentForm.value = { name: "", email: "", password: "" };
    };

    const saveStudent = async () => {
      if (
        !studentForm.value.name ||
        !studentForm.value.email ||
        !studentForm.value.password
      ) {
        return;
      }

      try {
        if (editMode.value) {
          await authStore.updateStudent(editingId.value, studentForm.value);
        } else {
          await authStore.addStudent(studentForm.value);
        }

        await loadStudents();
        closeModal();
      } catch (error) {
        console.error("Error saving student:", error);
      }
    };

    const editStudent = (student) => {
      editMode.value = true;
      editingId.value = student.firebaseKey || student.id;
      studentForm.value = {
        name: student.name,
        email: student.email,
        password: student.password,
      };
      showAddModal.value = true;
    };

    const confirmDelete = (student) => {
      studentToDelete.value = student;
      showDeleteModal.value = true;
    };

    const deleteStudent = async () => {
      if (studentToDelete.value) {
        try {
          await authStore.deleteStudent(
            studentToDelete.value.firebaseKey || studentToDelete.value.id
          );
          await loadStudents();
        } catch (error) {
          console.error("Error deleting student:", error);
        }
      }
      showDeleteModal.value = false;
      studentToDelete.value = null;
    };

    onMounted(async () => {
      await loadStudents();
    });

    return {
      students,
      searchQuery,
      showAddModal,
      showDeleteModal,
      editMode,
      studentForm,
      studentToDelete,
      filteredStudents,
      todayStudents,
      formatDate,
      closeModal,
      saveStudent,
      editStudent,
      confirmDelete,
      deleteStudent,
    };
  },
};
</script>

<style scoped>
.dashboard-header h2 {
  color: #1a1a2e;
  font-weight: 700;
}

.student-avatar {
  width: 35px;
  height: 35px;
  background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.password-code {
  background: #f8f9fa;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: #495057;
}

.search-box .form-control:focus {
  box-shadow: none;
  border-color: #4361ee;
}

.search-box .input-group-text {
  border-color: #dee2e6;
}

.search-box .form-control {
  border-color: #dee2e6;
}
</style>
