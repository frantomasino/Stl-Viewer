import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY_VISU);

// ⚠️ Asegurate de tener RESEND_API_KEY en .env.local
// y un dominio verificado (ej: no-reply@lambda3d.com.ar)

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
    }

    const subject = "Bienvenido/a al Visualizador de Lambda 3D";
    const link = "https://www.lambda3d.com.ar/visualizador";

    await resend.emails.send({
      from: "Lambda 3D <noreply@lambda3d.com.ar>", // <-- tu dominio verificado en Resend
      to: email,
      subject,
      html: `
         <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5; max-width:600px; margin:0 auto; padding:20px; background-color:#ffffff; border-radius:8px; border:1px solid #e5e7eb">
    <h2 style="margin:0 0 16px; font-size:20px; color:#111827">Hola${name ? " " + name : ""}, ¡bienvenido/a!</h2>
    <p style="margin:0 0 12px; font-size:14px; color:#374151">
      Gracias por ingresar a nuestro visualizador. A la brevedad te asignaremos un modelo para que pruebes las herramientas y nos cuentes tu experiencia.
    </p>
    <p style="margin:20px 0">
      <a href="${link}" target="_blank" rel="noreferrer"
        style="display:inline-block; padding:10px 18px; background-color:#33809d; color:#ffffff; border-radius:6px; text-decoration:none; font-weight:500;">
        Ingresar al visualizador
      </a>
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
    <div style="text-align:center">
      <a href="https://www.lambda3d.com.ar" target="_blank" rel="noreferrer">
        <img src="https://www.lambda3d.com.ar/logo/logo.png" alt="Lambda 3D" style="height:150px;"/>
      </a>
      <p style="font-size:12px; color:#6b7280; margin:0">
        <a href="https://www.lambda3d.com.ar" style="color:#6b7280; text-decoration:none">www.lambda3d.com.ar</a>
      </p>
    </div>
  </div>
      `,
      text: `Hola${name ? " " + name : ""}, ¡bienvenido/a!

Gracias por ingresar a nuestro visualizador. A la brevedad te asignaremos un modelo para que pruebes las herramientas y nos cuentes tu experiencia.

Ingresar: https://www.lambda3d.com.ar/visualizador

Equipo Lambda 3D — https://www.lambda3d.com.ar`,
    });
  // 2) Mail interno a Lambda (vos)
    await resend.emails.send({
      from: "Lambda 3D <noreply@lambda3d.com.ar>",
      to: "lambda3dbiomodelos@gmail.com", // <-- tu correo
      subject: "Nuevo usuario creado en el visualizador",
      html: `
        <div style="font-family:system-ui,sans-serif;line-height:1.5">
          <h2>Nuevo registro en el visualizador</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Nombre:</strong> ${name || "(sin nombre)"}</p>
          <p>Se acaba de crear un nuevo usuario en la plataforma.</p>
        </div>
      `,
      text: `Nuevo usuario creado en el visualizador:
- Email: ${email}
- Nombre: ${name || "(sin nombre)"}`,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error enviando welcome:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "send failed" }, { status: 500 });
  }
}
