"use client";

import type React from "react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  MapPin,
  Send,
  Smartphone,
  Linkedin,
  MessageSquare,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import correcto según tu estructura
import { sendContactMessage } from "../lib/firebase";

export function Contact() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    mensaje: "",
    tipo: "Biomodelo / Planificación",
  });

  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | "ok" | "err">(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) return;
    setLoading(true);
    setStatus(null);
    setErrorMsg(null);

    try {
      // Prepend del tipo de consulta al mensaje (tu API actual no tiene campo "tipo")
      const mensajeCompuesto =
        `[Tipo: ${formData.tipo}] ${formData.mensaje}`.trim();

      await sendContactMessage({
        name: formData.nombre.trim(),
        email: formData.email.trim(),
        phone: formData.telefono.trim(),
        message: mensajeCompuesto,
      });

      setStatus("ok");
      setFormData({
        nombre: "",
        email: "",
        telefono: "",
        mensaje: "",
        tipo: "Biomodelo / Planificación",
      });
      setAccepted(false);
    } catch (err: any) {
      console.error(err);
      setStatus("err");
      setErrorMsg(err?.message ?? "No se pudo enviar el mensaje.");
    } finally {
      setLoading(false);
    }
    try {
  const res = await fetch("/api/contact/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: formData.nombre.trim(),
      email: formData.email.trim(),
      telefono: formData.telefono.trim(),
      mensaje: formData.mensaje.trim(),
      tipo: formData.tipo, // ya lo tenés en tu estado
    }),
  });

  if (!res.ok) {
    // No rompemos la UX si falla el mail, solo avisamos en consola
    console.error("No se pudo enviar el correo (Resend).");
  }
} catch (e) {
  console.error("Fallo de red/Resend:", e);
}
  };
  

  return (
    <section id="contacto" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">
            Contanos tu proyecto
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Respondemos dentro de 48&nbsp;hs hábiles. Si es urgente, escribinos
            por{" "}
            <Link
              href="https://wa.me/5492346300627?text=Hola%20Lambda%203D.%20Me%20gustaría%20contactarlos%20por%20un%20proyecto%203D."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-medium text-green-600 hover:text-green-700"
            >
              WhatsApp
            </Link>
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="border-0 bg-background">
            <CardHeader>
              <CardTitle className="text-2xl">Enviános un mensaje</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre y apellido</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      type="text"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      maxLength={100}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={handleChange}
                      maxLength={30}
                      className="rounded-xl"
                      placeholder="+54 9 2346 30-0627"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de consulta</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(v) =>
                        setFormData((p) => ({ ...p, tipo: v }))
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Elegí una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Biomodelo / Planificación">
                          Biomodelo / Planificación
                        </SelectItem>
                        <SelectItem value="Impresión 3D">
                          Impresión 3D
                        </SelectItem>
                        <SelectItem value="Académico / Maquetas">
                          Académico / Maquetas
                        </SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensaje">Descripción del caso</Label>
                  <Textarea
                    id="mensaje"
                    name="mensaje"
                    rows={5}
                    value={formData.mensaje}
                    onChange={handleChange}
                    required
                    maxLength={5000}
                    className="rounded-xl resize-none"
                    placeholder="Objetivo, plazos y material disponible (DICOM, STL, etc.)."
                  />
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="consent"
                    checked={accepted}
                    onCheckedChange={(v) => setAccepted(Boolean(v))}
                  />
                  <label
                    htmlFor="consent"
                    className="text-sm text-muted-foreground"
                  >
                    Acepto la{" "}
                    <Link href="/politica-privacidad" className="underline">
                      Política de Privacidad
                    </Link>{" "}
                    y los{" "}
                    <Link href="/terminos-condiciones" className="underline">
                      Términos y Condiciones
                    </Link>
                    .
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button
                    type="submit"
                    className="rounded-2xl py-3 text-base font-medium group"
                    disabled={loading || !accepted}
                  >
                    <Send className="h-4 w-4 mr-2 transition-transform group-hover:translate-x-1" />
                    {loading ? "Enviando..." : "Enviar consulta"}
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="rounded-2xl py-3"
                  >
                    <Link
                      href="https://wa.me/5492346300627?text=Hola%20Lambda%203D.%20Me%20gustaría%20contactarlos%20por%20un%20proyecto%203D."
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Escribir por WhatsApp
                    </Link>
                  </Button>
                </div>

                {status === "ok" && (
                  <p className="text-sm text-green-700">
                    ✅ ¡Gracias! Te escribimos dentro de 48&nbsp;h hábiles.
                  </p>
                )}
                {status === "err" && (
                  <p className="text-sm text-red-700">
                    ❌ Hubo un problema. {errorMsg}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">
                Información de contacto
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">
                      lambda3dbiomodelos@gmail.com
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Linkedin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">LinkedIn</p>
                    <p className="text-muted-foreground">
                      <Link
                        href="https://ar.linkedin.com/company/lambda3d"
                        target="_blank"
                        rel="noopener noreferrer"
                        // className="underline"
                      >
                        Lambda 3D
                      </Link>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <Link
                      href="https://wa.me/5492346300627?text=Hola%20Lambda%203D.%20Me%20gustaría%20contactarlos%20por%20un%20proyecto%203D."
                      target="_blank"
                      rel="noopener noreferrer"
                      // className="underline"
                    >
                      +54 9 2346 30-0627
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Ubicación</p>
                    <p className="text-muted-foreground">
                      Chivilcoy, Argentina
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <Card className="border-0 bg-primary/5">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-2">
                  ¿Tenés un proyecto en mente?
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Transformamos imágenes médicas en modelos 3D para
                  planificación y docencia. Contanos tu objetivo y material
                  disponible y te asesoramos sin costo.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
