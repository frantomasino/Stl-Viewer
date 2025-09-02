// crearUsuarios.js
import "dotenv/config";
import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

// ---------- Inicializar Firebase Admin con .env ----------
if (!admin.apps.length) {
  const PID = process.env.FIREBASE_PROJECT_ID;
  const CE  = process.env.FIREBASE_CLIENT_EMAIL;
  const PK  = process.env.FIREBASE_PRIVATE_KEY;

  let serviceAccount;

  if (PID && CE && PK) {
    // Usar credenciales desde .env (clave con \n escapados)
    serviceAccount = {
      projectId: PID,
      clientEmail: CE,
      privateKey: PK.replace(/\\n/g, "\n"),
    };
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    // Alternativa: JSON embebido en .env
    serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Alternativa: ruta a archivo JSON
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const abs = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), credPath);
    serviceAccount = JSON.parse(fs.readFileSync(abs, "utf8"));
  } else {
    console.error(
      "❌ No encuentro credenciales. Definí en .env: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY (con \\n),\n" +
      "o bien GOOGLE_APPLICATION_CREDENTIALS_JSON, o GOOGLE_APPLICATION_CREDENTIALS."
    );
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const db   = admin.firestore();

// ---------- Datos de ejemplo ----------
const usersData = [
  { uid: "1", nickname: "Lambda", email: "lambda@gmail.com", password: "lambda123", projects: ["p1", "p2"] },
  { uid: "2", nickname: "Sino",   email: "sino@gmail.com",   password: "sino123",   projects: ["p2"] },
  { uid: "3", nickname: "Piojo",  email: "piojo@gmail.com",  password: "piojo123",  projects: ["p2"] },
  { uid: "4", nickname: "Mono",   email: "mono@gmail.com",   password: "mono123",   projects: ["p1"] },
  { uid: "5", nickname: "lucas",  email: "lucas@gmail.com",  password: "lucas123",  projects: ["p1"] },
  { uid: "6", nickname: "toma",   email: "toma@gmail.com",   password: "toma123",   projects: ["p1"] },
  { uid: "7", nickname: "fran",   email: "fran@gmail.com",   password: "fran123",   projects: ["p1"] },
  { uid: "8", nickname: "pepe",   email: "pepe@gmail.com",   password: "pepe123",   projects: ["p2"] },
  { uid: "9", nickname: "ftoma",  email: "ftoma@gmail.com",  password: "toma123",   projects: ["p2"] }
];

const projectsData = [
  { pid: "p1", name: "Proyecto 1", archives: ["aaa.jpg"],            users: ["1"] },
  { pid: "p2", name: "Proyecto 2", archives: ["aaa.jpg", "bbb.jpg"], users: ["1", "2"] },
];

// ---------- Seed ----------
async function crearUsuariosYProyectos() {
  try {
    const userRefs    = new Map();
    const projectRefs = new Map();

    usersData.forEach(u => userRefs.set(u.uid, db.collection("users").doc(u.uid)));
    projectsData.forEach(p => projectRefs.set(p.pid, db.collection("projects").doc(p.pid)));

    const batch = db.batch();

    // Usuarios
    for (const u of usersData) {
      try {
        let userExists = null;
        try {
          userExists = await auth.getUser(u.uid);
          console.log(`⚠️ Usuario Auth ya existe: ${u.email}`);
        } catch {} // no existe

        if (!userExists) {
          await auth.createUser({ uid: u.uid, email: u.email, password: u.password });
          console.log(`✅ Auth: ${u.uid} → ${u.email}`);
        }

        const hash    = await bcrypt.hash(u.password, 10);
        const projRef = u.projects.map(pid => projectRefs.get(pid));

        batch.set(
          userRefs.get(u.uid),
          {
            nickname: u.nickname,
            nicknameLower: u.nickname.toLowerCase(),
            email: u.email,
            passwordHash: hash,
            projects: projRef,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error(`⚠️ Error creando usuario ${u.email}:`, error?.message ?? error);
      }
    }

    // Proyectos
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
    process.exit(1);
  }
}

crearUsuariosYProyectos();
