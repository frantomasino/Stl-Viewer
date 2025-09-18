"use client";

import type React from "react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, Smartphone  } from "lucide-react";

export function Contact() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    mensaje: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic would go here
    console.log("Form submitted:", formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
                  <Label htmlFor="mensaje">Mensaje</Label>
                  <Textarea
                    id="mensaje"
                    name="mensaje"
                    rows={5}
                    value={formData.mensaje}
                    onChange={handleChange}
                    required
                    className="rounded-xl resize-none"
                    placeholder="Contanos sobre tu proyecto..."
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-2xl py-3 text-base font-medium group"
                >
                  <Send className="h-4 w-4 mr-2 transition-transform group-hover:translate-x-1" />
                  Enviar
                </Button>
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
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Teléfono</p>
               
                      <Link
                        href="https://wa.me/5492346300627?text=Hola%20Lambda%203D.%20Quiero%20que%20me%20pases%20mas%20informacion%20sobre...
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
