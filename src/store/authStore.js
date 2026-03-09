import { defineStore } from "pinia";
import { firebaseDB, DB_PATHS } from "../firebase/config";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: JSON.parse(localStorage.getItem("user")) || null,
    isLoggedIn: !!localStorage.getItem("user"),
    students: [],
    teachers: [],
    admins: [],
    isLoading: false,
  }),

  actions: {
    // تحميل جميع المستخدمين من Firebase
    async loadAllUsers() {
      this.isLoading = true;
      try {
        const [studentsData, teachersData, adminsData] = await Promise.all([
          firebaseDB.get(DB_PATHS.STUDENTS),
          firebaseDB.get(DB_PATHS.TEACHERS),
          firebaseDB.get(DB_PATHS.ADMIN),
        ]);

        this.students = firebaseDB.objectToArray(studentsData);
        this.teachers = firebaseDB.objectToArray(teachersData);
        this.admins = firebaseDB.objectToArray(adminsData);
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        this.isLoading = false;
      }
    },

    // تحميل الطلاب فقط
    async loadStudents() {
      this.isLoading = true;
      try {
        const data = await firebaseDB.get(DB_PATHS.STUDENTS);
        this.students = firebaseDB.objectToArray(data);
      } catch (error) {
        console.error("Error loading students:", error);
      } finally {
        this.isLoading = false;
      }
    },

    async login(email, password) {
      this.isLoading = true;
      try {
        // تحميل المستخدمين من Firebase
        await this.loadAllUsers();

        // تحقق من بيانات الأدمن
        const admin = this.admins.find(
          (a) => a.email === email && a.password === password
        );
        if (admin) {
          this.user = {
            id: admin.firebaseKey,
            email: admin.email,
            name: admin.name,
            role: "admin",
          };
          this.isLoggedIn = true;
          localStorage.setItem("user", JSON.stringify(this.user));
          return { success: true, role: "admin" };
        }

        // تحقق من بيانات الأستاذ
        const teacher = this.teachers.find(
          (t) => t.email === email && t.password === password
        );
        if (teacher) {
          this.user = {
            id: teacher.firebaseKey,
            email: teacher.email,
            name: teacher.name,
            role: "teacher",
          };
          this.isLoggedIn = true;
          localStorage.setItem("user", JSON.stringify(this.user));
          return { success: true, role: "teacher" };
        }

        // تحقق من بيانات الطلاب
        const student = this.students.find(
          (s) => s.email === email && s.password === password
        );
        if (student) {
          this.user = {
            id: student.firebaseKey,
            email: student.email,
            name: student.name,
            role: "student",
          };
          this.isLoggedIn = true;
          localStorage.setItem("user", JSON.stringify(this.user));
          return { success: true, role: "student" };
        }

        return {
          success: false,
          message: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        };
      } catch (error) {
        console.error("Login error:", error);
        return {
          success: false,
          message: "حدث خطأ أثناء تسجيل الدخول",
        };
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      this.user = null;
      this.isLoggedIn = false;
      localStorage.removeItem("user");
    },

    // إضافة طالب جديد
    async addStudent(studentData) {
      try {
        const newStudent = {
          email: studentData.email,
          password: studentData.password,
          name: studentData.name,
          role: "student",
          createdAt: new Date().toISOString(),
        };
        const firebaseKey = await firebaseDB.post(
          DB_PATHS.STUDENTS,
          newStudent
        );
        const studentWithKey = { ...newStudent, firebaseKey };
        this.students.push(studentWithKey);
        return studentWithKey;
      } catch (error) {
        console.error("Error adding student:", error);
        throw error;
      }
    },

    // تحديث بيانات طالب
    async updateStudent(firebaseKey, studentData) {
      try {
        await firebaseDB.patch(DB_PATHS.STUDENTS, firebaseKey, studentData);
        const index = this.students.findIndex(
          (s) => s.firebaseKey === firebaseKey
        );
        if (index !== -1) {
          this.students[index] = { ...this.students[index], ...studentData };
        }
        return true;
      } catch (error) {
        console.error("Error updating student:", error);
        throw error;
      }
    },

    // حذف طالب
    async deleteStudent(firebaseKey) {
      try {
        await firebaseDB.delete(DB_PATHS.STUDENTS, firebaseKey);
        this.students = this.students.filter(
          (s) => s.firebaseKey !== firebaseKey
        );
        return true;
      } catch (error) {
        console.error("Error deleting student:", error);
        throw error;
      }
    },

    // الحصول على قائمة الطلاب
    getStudents() {
      return this.students;
    },

    // إضافة أستاذ جديد
    async addTeacher(teacherData) {
      try {
        const newTeacher = {
          email: teacherData.email,
          password: teacherData.password,
          name: teacherData.name,
          role: "teacher",
          createdAt: new Date().toISOString(),
        };
        const firebaseKey = await firebaseDB.post(
          DB_PATHS.TEACHERS,
          newTeacher
        );
        const teacherWithKey = { ...newTeacher, firebaseKey };
        this.teachers.push(teacherWithKey);
        return teacherWithKey;
      } catch (error) {
        console.error("Error adding teacher:", error);
        throw error;
      }
    },

    // إضافة أدمن جديد
    async addAdmin(adminData) {
      try {
        const newAdmin = {
          email: adminData.email,
          password: adminData.password,
          name: adminData.name,
          role: "admin",
          createdAt: new Date().toISOString(),
        };
        const firebaseKey = await firebaseDB.post(DB_PATHS.ADMIN, newAdmin);
        const adminWithKey = { ...newAdmin, firebaseKey };
        this.admins.push(adminWithKey);
        return adminWithKey;
      } catch (error) {
        console.error("Error adding admin:", error);
        throw error;
      }
    },
  },
});
