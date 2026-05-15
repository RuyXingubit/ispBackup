import Link from "next/link";
import { ArrowRight, Server } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/10">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />

        <div className="text-center relative z-10">
          <div className="mx-auto h-12 w-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
            <Server className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Cadastre seu Provedor
          </h2>
          <p className="mt-2 text-sm text-foreground/60">
            Inicie sua jornada para uma infraestrutura blindada.
          </p>
        </div>

        <form className="mt-8 space-y-6 relative z-10" action="#" method="POST">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="company-name" className="sr-only">
                Nome da Empresa
              </label>
              <input
                id="company-name"
                name="company"
                type="text"
                required
                className="w-full appearance-none rounded-xl border border-border bg-card/50 px-4 py-3 text-foreground placeholder-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all duration-200"
                placeholder="Nome do Provedor (ISP)"
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full appearance-none rounded-xl border border-border bg-card/50 px-4 py-3 text-foreground placeholder-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all duration-200"
                placeholder="Email Administrativo"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full appearance-none rounded-xl border border-border bg-card/50 px-4 py-3 text-foreground placeholder-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-all duration-200"
                placeholder="Crie uma Senha"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-all duration-200 hover-glass group"
            >
              Criar Conta e Acessar
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/60 relative z-10">
          Já possui uma conta?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
            Faça Login
          </Link>
        </p>
      </div>
    </div>
  );
}
