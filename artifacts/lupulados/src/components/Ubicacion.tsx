import { MapPin, Clock, Phone, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactInput } from "@/domain/contact";
import { buildWhatsAppUrl, businessLocation, whatsappDisplayNumber } from "@/domain/businessConfig";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function Ubicacion() {
  const { toast } = useToast();
  
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" }
  });

  function onSubmit(data: ContactInput) {
    const message = [
      "Hola! Quiero hacer una consulta desde la web de Lupulados.",
      "",
      `Nombre: ${data.name}`,
      `Email: ${data.email}`,
      `Mensaje: ${data.message}`,
    ].join("\n");

    window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
    toast({ title: "Consulta preparada", description: "Se abrió WhatsApp para que puedas enviar el mensaje." });
  }

  return (
    <section id="ubicacion" className="py-24 bg-secondary/50 relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Info Card */}
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
              Contactanos
            </h2>
            <p className="text-muted-foreground text-lg mb-10">
              Ya sea para encargar un barril, reservar una chata o consultar por ventas mayoristas, estamos para ayudarte.
            </p>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Ubicación (Fábrica)</h4>
                  <p className="text-muted-foreground">{businessLocation.factoryLabel}<br/>{businessLocation.locality}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Horarios de Retiro</h4>
                  <p className="text-muted-foreground">Lunes a Viernes: 9:00 a 18:00hs<br/>Sábados: 9:00 a 14:00hs</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">WhatsApp</h4>
                  <a href={buildWhatsAppUrl("Hola! Quiero hacer una consulta")} className="text-primary hover:underline">{whatsappDisplayNumber}</a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Email</h4>
                  <a href="mailto:info@lupulados.com.ar" className="text-primary hover:underline">info@lupulados.com.ar</a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card p-8 md:p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <h3 className="text-2xl font-bold text-white mb-6">Dejanos tu mensaje</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" className="bg-black/50 border-white/10 text-white focus-visible:ring-primary" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="tu@email.com" className="bg-black/50 border-white/10 text-white focus-visible:ring-primary" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Mensaje</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="¿En qué te podemos ayudar?" 
                          className="bg-black/50 border-white/10 text-white focus-visible:ring-primary min-h-[120px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-amber-500 text-black font-bold h-12 text-lg shadow-[0_0_15px_rgba(217,119,6,0.3)] hover:shadow-[0_0_25px_rgba(217,119,6,0.5)] transition-all"
                >
                  Consultar por WhatsApp
                </Button>
              </form>
            </Form>
          </div>

        </div>
      </div>
    </section>
  );
}
