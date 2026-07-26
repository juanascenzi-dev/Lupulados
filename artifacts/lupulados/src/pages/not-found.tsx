import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <main id="contenido-principal" tabIndex={-1} className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="max-w-md w-full px-6 py-8 bg-card border border-white/10 rounded-2xl shadow-xl flex flex-col items-center text-center">
        <AlertCircle className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-3xl font-display font-bold text-white mb-2">Página no encontrada</h1>
        <p className="text-muted-foreground mb-8">
          La página que estás buscando no existe o fue movida.
        </p>
        <a 
          href="/"
          className="px-6 py-3 rounded-full bg-primary text-black font-bold hover:bg-amber-400 transition-colors"
        >
          Volver al Inicio
        </a>
      </div>
    </main>
  );
}
