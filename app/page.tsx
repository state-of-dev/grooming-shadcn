import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CreditCard, Globe, ArrowRight, Check } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/50">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            Plataforma para Groomers
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Gestiona citas, pagos y clientes en un solo lugar con tecnología moderna
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8">
              Comenzar ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Ver demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Todo lo que necesitas
            </h2>
            <p className="text-xl text-muted-foreground">
              Herramientas profesionales para tu negocio de grooming
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Reservas Online</CardTitle>
                <CardDescription className="text-base">
                  Tus clientes pueden reservar citas 24/7 sin llamadas
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Pagos Automáticos</CardTitle>
                <CardDescription className="text-base">
                  Cobra automáticamente con tarjeta o transferencia
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Tu Página Web</CardTitle>
                <CardDescription className="text-base">
                  Página profesional lista en minutos
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Amado por profesionales</h2>
            <p className="text-xl text-muted-foreground">Descubre por qué los mejores groomers eligen nuestra plataforma.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <p className='italic'>"Esta plataforma ha revolucionado mi negocio. La gestión de citas en tiempo real es increíble y mis clientes aman la facilidad para reservar."</p>
                <div className="flex items-center pt-4 mt-4 border-t">
                  <div className="w-12 h-12 rounded-full bg-muted mr-4"></div>
                  <div>
                    <p className="font-semibold">Ana Pérez</p>
                    <p className="text-sm text-muted-foreground">Groomer en Paws & Claws</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className='italic'>"Pasé de un sistema de agenda en papel a esto y la diferencia es abismal. Ahorro horas cada semana y tengo control total de mi agenda."</p>
                <div className="flex items-center pt-4 mt-4 border-t">
                  <div className="w-12 h-12 rounded-full bg-muted mr-4"></div>
                  <div>
                    <p className="font-semibold">Carlos López</p>
                    <p className="text-sm text-muted-foreground">Dueño de Peludos Felices</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className='italic'>"La página web personalizada le da a mi negocio una imagen mucho más profesional. ¡Mis ingresos han aumentado un 20% desde que la uso!"</p>
                <div className="flex items-center pt-4 mt-4 border-t">
                  <div className="w-12 h-12 rounded-full bg-muted mr-4"></div>
                  <div>
                    <p className="font-semibold">Sofía Martínez</p>
                    <p className="text-sm text-muted-foreground">Estilista Canina Independiente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Planes para cada negocio</h2>
            <p className="text-xl text-muted-foreground">Elige el plan que mejor se adapte a tu tamaño y necesidades.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl">Básico</CardTitle>
                <CardDescription>Ideal para empezar y negocios pequeños.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="text-4xl font-bold">$25<span className="text-xl font-normal text-muted-foreground">/mes</span></div>
                <ul className="space-y-2">
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2" />Hasta 50 citas/mes</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2" />1 Página de negocio</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2" />Soporte por email</li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Button className="w-full">Empezar Plan Básico</Button>
              </div>
            </Card>
            <Card className="flex flex-col border-2 border-primary shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Profesional</CardTitle>
                  <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">MÁS POPULAR</div>
                </div>
                <CardDescription>Perfecto para negocios en crecimiento.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="text-4xl font-bold">$59<span className="text-xl font-normal text-muted-foreground">/mes</span></div>
                <ul className="space-y-2">
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2" />Citas ilimitadas</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2" />Página web personalizable</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2" />Acepta pagos con tarjeta</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2" />Soporte prioritario</li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Button className="w-full">Empezar Plan Pro</Button>
              </div>
            </Card>
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl">Empresarial</CardTitle>
                <CardDescription>Soluciones a medida para grandes volúmenes.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="text-4xl font-bold">Contacto</div>
                <ul className="space-y-2">
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2" />Todo lo de Profesional</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2" />Múltiples sucursales</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2" />Roles y permisos de equipo</li>
                  <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2" />Soporte dedicado</li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Button variant="outline" className="w-full">Contactar Ventas</Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-2">
            <CardContent className="pt-12 pb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                ¿Listo para empezar?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Únete a cientos de groomers que ya transformaron su negocio
              </p>
              <Button size="lg" className="text-lg px-12">
                Crear mi cuenta gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
