// app/api/contact/route.ts
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY_FORM);

export async function POST(req: Request) {
  try {
    const { nombre, email, telefono, mensaje, tipo } = await req.json();

    // Validaciones mínimas (opcional)
    if (!nombre || !email || !mensaje) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const html = /* html */ `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.5; color:#111">
        <h2 style="margin:0 0 8px">Nueva consulta desde la web</h2>
        <p style="margin:0 0 8px"><strong>Tipo:</strong> ${tipo || "—"}</p>
        <p style="margin:0 0 8px"><strong>Nombre:</strong> ${nombre}</p>
        <p style="margin:0 0 8px"><strong>Email:</strong> ${email}</p>
        <p style="margin:0 0 8px"><strong>Teléfono:</strong> ${telefono || "—"}</p>
        <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb" />
        <p style="margin:0 0 4px"><strong>Mensaje:</strong></p>
        <pre style="white-space:pre-wrap;margin:0;background:#f9fafb;padding:12px;border:1px solid #e5e7eb;border-radius:8px">${mensaje}</pre>
      </div>
    `;

    await resend.emails.send({
      from: "Formulario web <noreply@lambda3d.com.ar>",
      to: process.env.NEXT_PUBLIC_RESEND_TO!,
      subject: `Nueva consulta `,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Resend error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo enviar el correo" },
      { status: 500 }
    );
  }
}
