"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Mail,
  MapPin,
  Send,
  Smartphone,
  Linkedin,
  MessageSquare,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { sendContactMessage } from "../lib/firebase"

const initialFormData = {
  nombre: "",
  email: "",
  telefono: "",
  mensaje: "",
  tipo: "Biomodelo personalizado",
}

export function Contact() {
  const [formData, setFormData] = useState(initialFormData)
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<null | "ok" | "err">(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!accepted || loading) return

    setLoading(true)
    setStatus(null)
    setErrorMsg(null)

    const payload = {
      nombre: formData.nombre.trim(),
      email: formData.email.trim(),
      telefono: formData.telefono.trim(),
      mensaje: formData.mensaje.trim(),
      tipo: formData.tipo,
    }

    try {
      const mensajeCompuesto = `[Tipo: ${payload.tipo}] ${payload.mensaje}`

      await sendContactMessage({
        name: payload.nombre,
        email: payload.email,
        phone: payload.telefono,
        message: mensajeCompuesto,
      })

      try {
        const res = await fetch("/api/contact/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          console.error("No se pudo enviar el correo por /api/contact.")
        }
      } catch (mailError) {
        console.error("Fallo de red al enviar correo:", mailError)
      }

      setStatus("ok")
      setFormData(initialFormData)
      setAccepted(false)
    } catch (err: any) {
      console.error(err)
      setStatus("err")
      setErrorMsg(err?.message ?? "No se pudo enviar el mensaje.")
    } finally {
      setLoading(false)
    }
  }
  const getWhatsappUrl = () => {
  const message = [
    "Hola Lambda 3D. Me gustaría consultar por un proyecto 3D.",
    "",
    `Tipo de consulta: ${formData.tipo}`,
    formData.nombre.trim() ? `Nombre: ${formData.nombre.trim()}` : "",
    formData.email.trim() ? `Email: ${formData.email.trim()}` : "",
    formData.telefono.trim() ? `Teléfono: ${formData.telefono.trim()}` : "",
    formData.mensaje.trim()
      ? `Descripción del caso: ${formData.mensaje.trim()}`
      : "",
  ]
    .filter(Boolean)
    .join("\n")

  return `https://wa.me/5492346300627?text=${encodeURIComponent(message)}`
}

  return (
    <section id="contacto" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">
            Hablemos de tu caso
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Consultanos por biomodelos personalizados, segmentación 3D,
            maquetas educativas, proyectos institucionales o alianzas con
            empresas médicas. Si necesitás una respuesta rápida, también podés
            escribirnos por{" "}
            <Link
              href="https://wa.me/5492346300627?text=Hola%20Lambda%203D.%20Me%20gustaría%20consultar%20por%20un%20proyecto%203D."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-medium text-green-600 hover:text-green-700"
            >
              WhatsApp
            </Link>
            .
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="border-0 bg-background">
            <CardHeader>
              <CardTitle className="text-2xl">Enviar consulta</CardTitle>
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
                        setFormData((prev) => ({ ...prev, tipo: v }))
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Elegí una opción" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="Biomodelo personalizado">
                          Biomodelo personalizado
                        </SelectItem>

                        <SelectItem value="Segmentación 3D de imágenes médicas">
                          Segmentación 3D de imágenes médicas
                        </SelectItem>

                        <SelectItem value="Maquetas educativas">
                          Maquetas educativas
                        </SelectItem>

                        <SelectItem value="Consulta institucional">
                          Consulta institucional
                        </SelectItem>

                        <SelectItem value="Distribuidores / alianzas">
                          Distribuidores / alianzas
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
                    placeholder="Contanos el objetivo del proyecto, especialidad, plazos y material disponible: DICOM, STL, imágenes, referencias o necesidad institucional."
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
                      href={getWhatsappUrl()}
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
                    ✅ ¡Gracias! Recibimos tu consulta y te vamos a responder a
                    la brevedad.
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
                      href="https://wa.me/5492346300627?text=Hola%20Lambda%203D.%20Me%20gustaría%20consultar%20por%20un%20proyecto%203D."
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
                      Chivilcoy, Buenos Aires, Argentina
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <Card className="border-0 bg-primary/5">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-2">
                  Para médicos, instituciones y empresas
                </h4>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Podemos acompañar proyectos puntuales, biomodelos
                  personalizados, desarrollos educativos, consultas
                  institucionales y posibles alianzas con empresas de tecnología
                  médica o distribuidores.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}