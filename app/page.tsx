import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Services } from "@/components/services"
import { Benefits } from "@/components/benefits"
import { Cases } from "@/components/cases"
import { About } from "@/components/about"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Services />
      <Cases />
      <Benefits />
      <About />
      <Contact />
      <Footer />
    </main>
  )
}
