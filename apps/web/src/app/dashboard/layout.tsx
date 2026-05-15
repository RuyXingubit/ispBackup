import Link from "next/link";
import { LayoutDashboard, HardDrive, Settings, Shield, LogOut } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/30 backdrop-blur-xl flex flex-col transition-all">
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <div className="h-8 w-8 bg-primary/20 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">ispBackup</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium hover-glass">
            <LayoutDashboard className="h-5 w-5" />
            Visão Geral
          </Link>
          <Link href="/dashboard/edge" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/70 hover:text-foreground hover:bg-card hover-glass transition-colors">
            <HardDrive className="h-5 w-5" />
            Agentes de Borda
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/70 hover:text-foreground hover:bg-card hover-glass transition-colors">
            <Settings className="h-5 w-5" />
            Configurações
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <Link href="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/70 hover:text-red-400 hover:bg-red-400/10 transition-colors">
            <LogOut className="h-5 w-5" />
            Sair
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
        <div className="h-full w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
