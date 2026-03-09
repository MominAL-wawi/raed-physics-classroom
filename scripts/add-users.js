// سكريبت لإضافة يوزر الأستاذ والأدمن في Firebase
const DATABASE_URL = "https://studyphysics-bd79d-default-rtdb.firebaseio.com";

async function addUsers() {
  // بيانات الأدمن
  const adminData = {
    email: "admin@studyphysics.com",
    password: "admin123",
    name: "مدير النظام",
    role: "admin",
    createdAt: new Date().toISOString(),
  };

  // بيانات الأستاذ
  const teacherData = {
    email: "teacher@studyphysics.com",
    password: "teacher123",
    name: "أستاذ الفيزياء",
    role: "teacher",
    createdAt: new Date().toISOString(),
  };

  try {
    // إضافة الأدمن
    const adminResponse = await fetch(`${DATABASE_URL}/admin.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminData),
    });
    const adminResult = await adminResponse.json();
    console.log("تم إضافة الأدمن:", adminResult);
    console.log("بيانات الأدمن:");
    console.log("  البريد الإلكتروني:", adminData.email);
    console.log("  كلمة المرور:", adminData.password);

    // إضافة الأستاذ
    const teacherResponse = await fetch(`${DATABASE_URL}/Teacher.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(teacherData),
    });
    const teacherResult = await teacherResponse.json();
    console.log("\nتم إضافة الأستاذ:", teacherResult);
    console.log("بيانات الأستاذ:");
    console.log("  البريد الإلكتروني:", teacherData.email);
    console.log("  كلمة المرور:", teacherData.password);

    console.log("\n=================================");
    console.log("تم إضافة المستخدمين بنجاح!");
    console.log("=================================");
  } catch (error) {
    console.error("خطأ في إضافة المستخدمين:", error);
  }
}

addUsers();
