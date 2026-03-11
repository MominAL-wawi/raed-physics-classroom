<template>
  <div
    class="question-card"
    :class="{ 'true-false': question.type === 'truefalse' }"
  >
    <div class="d-flex justify-content-between align-items-start mb-2">
      <span
        class="question-type-badge"
        :class="
          question.type === 'multiple'
            ? 'bg-primary text-white'
            : 'bg-success text-white'
        "
      >
        {{ question.type === "multiple" ? "اختيار من متعدد" : "صح / خطأ" }}
      </span>
      <div class="btn-group btn-group-sm">
        <button
          class="btn btn-outline-primary"
          @click="$emit('edit', question)"
        >
          <i class="bi bi-pencil"></i>
        </button>
        <button
          class="btn btn-outline-danger"
          @click="$emit('delete', question.firebaseKey || question.id)"
        >
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>

    <h6 class="mb-3">{{ question.text }}</h6>

    <img
      v-if="question.image"
      :src="question.image"
      alt="صورة السؤال"
      class="question-image"
    />

    <div v-if="question.type === 'multiple'" class="options-list">
      <div
        v-for="(option, index) in question.options"
        :key="index"
        class="option-item d-flex align-items-center mb-2"
      >
        <span
          class="badge me-2"
          :class="
            option === question.correctAnswer ? 'bg-success' : 'bg-secondary'
          "
        >
          {{ ["أ", "ب", "ج", "د", "هـ", "و"][index] || index + 1 }}
        </span>
        <span
          :class="{ 'text-success fw-bold': option === question.correctAnswer }"
        >
          {{ option }}
          <i
            v-if="option === question.correctAnswer"
            class="bi bi-check-circle-fill text-success ms-1"
          ></i>
        </span>
      </div>
    </div>

    <div v-else class="true-false-answer">
      <span
        class="badge"
        :class="question.correctAnswer === 'true' ? 'bg-success' : 'bg-danger'"
      >
        الإجابة الصحيحة: {{ question.correctAnswer === "true" ? "صح" : "خطأ" }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: "QuestionCard",
  props: {
    question: {
      type: Object,
      required: true,
    },
  },
  emits: ["edit", "delete"],
};
</script>

<style scoped>
.option-item {
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
}
</style>
