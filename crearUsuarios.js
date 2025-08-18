// crearUsuarios.js
const admin = require("firebase-admin");

// Inicializar Firebase Admin usando variables de entorno
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const auth = admin.auth();

// Lista de usuarios a crear
const usuarios = [
  { email: "usuario1@lambda.com", password: "contraseña123" },
  { email: "usuario2@lambda.com", password: "contraseña123" },
  { email: "usuario3@lambda.com", password: "contraseña123" },
  { email: "usuario4@lambda.com", password: "contra123" },
  { email: "usuario5@lambda.com", password: "contra123" },
  { email: "frantoma@lambda.com", password: "contra123" },
];

async function crearUsuarios() {
  for (const u of usuarios) {
    try {
      const userRecord = await auth.createUser({
        email: u.email,
        password: u.password,
      });
      console.log(`Usuario creado: ${userRecord.uid} → ${u.email}`);
    } catch (error) {
      console.error(`Error creando ${u.email}:`, error.message);
    }
  }
}

crearUsuarios();
