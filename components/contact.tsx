"use client";

import type React from "react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Send, Smartphone,Linkedin  } from "lucide-react";

// Import correcto según tu estructura
import { sendContactMessage } from "../lib/firebase";

export function Contact() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    mensaje: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | "ok" | "err">(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setErrorMsg(null);

    try {
      await sendContactMessage({
        name: formData.nombre.trim(),
        email: formData.email.trim(),
        phone: formData.telefono.trim(),
        message: formData.mensaje.trim(),
      });

      setStatus("ok");
      setFormData({ nombre: "", email: "", telefono: "", mensaje: "" });
    } catch (err: any) {
      console.error(err);
      setStatus("err");
      setErrorMsg(err?.message ?? "No se pudo enviar el mensaje.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contacto" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">
            Hablemos de tu proyecto
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Estamos aquí para ayudarte a materializar tus ideas en soluciones 3D
            innovadoras
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="border-0 bg-background">
            <CardHeader>
              <CardTitle className="text-2xl">Envíanos un mensaje</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    maxLength={30}
                    className="rounded-xl"
                    placeholder="+54 9 2346 30-0627"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensaje">Mensaje</Label>
                  <Textarea
                    id="mensaje"
                    name="mensaje"
                    rows={5}
                    value={formData.mensaje}
                    onChange={handleChange}
                    required
                    maxLength={5000}
                    className="rounded-xl resize-none"
                    placeholder="Contanos sobre tu proyecto..."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-2xl py-3 text-base font-medium group"
                  disabled={loading}
                >
                  <Send className="h-4 w-4 mr-2 transition-transform group-hover:translate-x-1" />
                  {loading ? "Enviando..." : "Enviar"}
                </Button>

                {status === "ok" && (
                  <p className="text-sm text-green-700">
                    ✅ ¡Mensaje enviado! Te vamos a contactar.
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
                    <p className="font-medium">Linkedin</p>
                    <p className="text-muted-foreground">
                                          <Link
                      href="https://ar.linkedin.com/company/lambda3d"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Lambda3d
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
                      href="https://wa.me/5492346300627?text=Hola%20Lambda%203D.%20Me%20gustaría%20contactarlos%20para%20recibir%20información%20sobre...
"
                      target="_blank"
                      rel="noopener noreferrer"
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
                    <p className="text-muted-foreground">Chivilcoy, Argentina</p>
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
                  Nuestro equipo está listo para ayudarte a desarrollar
                  soluciones 3D personalizadas para tus necesidades específicas
                  en salud y educación.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
