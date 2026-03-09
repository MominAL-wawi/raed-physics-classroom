<template>
  <div class="file-card">
    <div class="file-icon" :class="file.type">
      <i :class="fileIcon"></i>
    </div>
    <div class="file-info flex-grow-1">
      <h6 class="mb-1">{{ file.name }}</h6>
      <small class="text-muted" v-if="file.type === 'link'">
        <i class="bi bi-link-45deg me-1"></i>{{ file.url }}
      </small>
      <small class="text-muted" v-else>{{ formatDate(file.uploadedAt) }}</small>
    </div>
    <div class="file-actions">
      <a
        :href="file.url"
        target="_blank"
        class="btn btn-sm btn-primary-custom me-2"
      >
        <i
          :class="
            file.type === 'link' ? 'bi bi-box-arrow-up-right' : 'bi bi-eye'
          "
        ></i>
        {{ file.type === "link" ? "فتح" : "عرض" }}
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
  computed: {
    fileIcon() {
      if (this.file.type === "pdf") return "bi bi-file-pdf";
      if (this.file.type === "image") return "bi bi-file-image";
      if (this.file.type === "link") return "bi bi-link-45deg";
      return "bi bi-file";
    },
  },
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
