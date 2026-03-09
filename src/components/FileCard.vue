<template>
  <div class="file-card">
    <div class="file-icon" :class="file.type">
      <i
        :class="file.type === 'pdf' ? 'bi bi-file-pdf' : 'bi bi-file-image'"
      ></i>
    </div>
    <div class="file-info flex-grow-1">
      <h6 class="mb-1">{{ file.name }}</h6>
      <small class="text-muted">{{ formatDate(file.uploadedAt) }}</small>
    </div>
    <div class="file-actions">
      <a
        :href="file.url"
        target="_blank"
        class="btn btn-sm btn-primary-custom me-2"
      >
        <i class="bi bi-eye"></i>
        عرض
      </a>
      <button
        v-if="showDelete"
        class="btn btn-sm btn-danger-custom"
        @click="$emit('delete', file.firebaseKey || file.id)"
      >
        <i class="bi bi-trash"></i>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "FileCard",
  props: {
    file: {
      type: Object,
      required: true,
    },
    showDelete: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["delete"],
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
  },
};
</script>
