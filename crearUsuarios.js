// crearUsuarios.js
import admin from "firebase-admin";
import fs from "fs";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf-8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const db = admin.firestore();

// ======== Datos ========
const usersData = [
  { uid: "1", nickname: "Lambda", email: "lambda@gmail.com", password: "lambda123", projects: ["p1", "p2"] },
  { uid: "2", nickname: "Sino", email: "sino@gmail.com", password: "sino123", projects: ["p2"] },
  { uid: "3", nickname: "Piojo", email: "piojo@gmail.com", password: "piojo123", projects: ["p2"] },
  { uid: "4", nickname: "Mono", email: "mono@gmail.com", password: "mono123", projects: ["p1"] },
  { uid: "5", nickname: "lucas", email: "lucas@gmail.com", password: "lucas123", projects: ["p1"] },
  { uid: "6", nickname: "toma", email: "toma@gmail.com", password: "toma123", projects: ["p1"] },
  { uid: "7", nickname: "fran", email: "fran@gmail.com", password: "fran123", projects: ["p1"] },
  { uid: "8", nickname: "pepe", email: "pepe@gmail.com", password: "pepe123", projects: ["p2"] }
];

const projectsData = [
  { pid: "p1", name: "Proyecto 1", archives: ["aaa.jpg"], users: ["1"] },
  { pid: "p2", name: "Proyecto 2", archives: ["aaa.jpg", "bbb.jpg"], users: ["1", "2"] },
];
// ==================================

async function crearUsuariosYProyectos() {
  try {
    const userRefs = new Map();
    const projectRefs = new Map();

    // Crear referencias Firestore
    usersData.forEach(u => userRefs.set(u.uid, db.collection("users").doc(u.uid)));
    projectsData.forEach(p => projectRefs.set(p.pid, db.collection("projects").doc(p.pid)));

    const batch = db.batch();

    // ====== Crear usuarios en Auth y Firestore ======
    for (const u of usersData) {
      try {
        // Verificar si el usuario ya existe en Auth
        let userExists = null;
        try {
          userExists = await auth.getUser(u.uid);
          console.log(`⚠️ Usuario Auth ya existe: ${u.email}`);
        } catch {}

        // Crear en Auth si no existe
        if (!userExists) {
          await auth.createUser({
            uid: u.uid,
            email: u.email,
            password: u.password,
          });
          console.log(`✅ Auth: ${u.uid} → ${u.email}`);
        }

        // Guardar en Firestore
        const hash = await bcrypt.hash(u.password, 10);
        const projRefs = u.projects.map(pid => projectRefs.get(pid));

        batch.set(
          userRefs.get(u.uid),
          {
            nickname: u.nickname,
            nicknameLower: u.nickname.toLowerCase(), // ✅ campo para login por usuario
            email: u.email,
            passwordHash: hash,
            projects: projRefs,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error(`⚠️ Error creando usuario ${u.email}:`, error.message);
      }
    }

    // ====== Crear proyectos en Firestore ======
    for (const p of projectsData) {
      const uRefs = p.users.map(uid => userRefs.get(uid));

      batch.set(
        projectRefs.get(p.pid),
        {
          name: p.name,
          archives: p.archives,
          users: uRefs,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    console.log("✅ Firestore: usuarios y proyectos creados correctamente.");
  } catch (err) {
    console.error("❌ Error general:", err);
  }
}

crearUsuariosYProyectos();