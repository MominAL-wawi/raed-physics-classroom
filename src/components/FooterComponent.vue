<template>
  <footer class="footer">
    <div class="container">
      <p class="mb-0">
        جميع الحقوق محفوظة &copy; {{ currentYear }} - منصة التعليم الإلكتروني
      </p>
    </div>
  </footer>
</template>

<script>
export default {
  name: "FooterComponent",
  computed: {
    currentYear() {
      return new Date().getFullYear();
    },
  },
};
</script>
