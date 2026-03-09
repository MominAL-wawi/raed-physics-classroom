import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/store/authStore";

import LoginPage from "@/views/LoginPage.vue";
import AdminDashboard from "@/views/AdminDashboard.vue";
import TeacherDashboard from "@/views/TeacherDashboard.vue";
import StudentDashboard from "@/views/StudentDashboard.vue";
import QuestionsPage from "@/views/QuestionsPage.vue";
import ExamsPage from "@/views/ExamsPage.vue";
import CreateExamPage from "@/views/CreateExamPage.vue";
import TakeExamPage from "@/views/TakeExamPage.vue";
import FilesPage from "@/views/FilesPage.vue";
import ResultsPage from "@/views/ResultsPage.vue";
import StudentResultsPage from "@/views/StudentResultsPage.vue";
import ExamReviewPage from "@/views/ExamReviewPage.vue";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    meta: { requiresAuth: false },
  },
  // Admin Routes
  {
    path: "/admin",
    name: "AdminDashboard",
    component: AdminDashboard,
    meta: { requiresAuth: true, role: "admin" },
  },
  // Teacher Routes
  {
    path: "/teacher",
    name: "TeacherDashboard",
    component: TeacherDashboard,
    meta: { requiresAuth: true, role: "teacher" },
  },
  {
    path: "/teacher/questions",
    name: "Questions",
    component: QuestionsPage,
    meta: { requiresAuth: true, role: "teacher" },
  },
  {
    path: "/teacher/exams",
    name: "Exams",
    component: ExamsPage,
    meta: { requiresAuth: true, role: "teacher" },
  },
  {
    path: "/teacher/exams/create",
    name: "CreateExam",
    component: CreateExamPage,
    meta: { requiresAuth: true, role: "teacher" },
  },
  {
    path: "/teacher/files",
    name: "TeacherFiles",
    component: FilesPage,
    meta: { requiresAuth: true, role: "teacher" },
  },
  {
    path: "/teacher/results",
    name: "Results",
    component: ResultsPage,
    meta: { requiresAuth: true, role: "teacher" },
  },
  // Student Routes
  {
    path: "/student",
    name: "StudentDashboard",
    component: StudentDashboard,
    meta: { requiresAuth: true, role: "student" },
  },
  {
    path: "/student/exam/:id",
    name: "TakeExam",
    component: TakeExamPage,
    meta: { requiresAuth: true, role: "student" },
  },
  {
    path: "/student/files",
    name: "StudentFiles",
    component: FilesPage,
    meta: { requiresAuth: true, role: "student" },
  },
  {
    path: "/student/results",
    name: "StudentResults",
    component: StudentResultsPage,
    meta: { requiresAuth: true, role: "student" },
  },
  {
    path: "/student/results/review/:resultId",
    name: "ExamReview",
    component: ExamReviewPage,
    meta: { requiresAuth: true, role: "student" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next("/login");
  } else if (to.path === "/login" && authStore.isLoggedIn) {
    // Redirect based on role
    const role = authStore.user?.role;
    if (role === "admin") {
      next("/admin");
    } else if (role === "teacher") {
      next("/teacher");
    } else {
      next("/student");
    }
  } else if (to.meta.role && authStore.user?.role !== to.meta.role) {
    // Redirect to correct dashboard if wrong role
    const role = authStore.user?.role;
    if (role === "admin") {
      next("/admin");
    } else if (role === "teacher") {
      next("/teacher");
    } else {
      next("/student");
    }
  } else {
    next();
  }
});

export default router;
