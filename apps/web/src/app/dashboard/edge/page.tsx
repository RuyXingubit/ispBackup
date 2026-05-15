"use client";

import { useState } from "react";
import { Terminal, Copy, Check, HardDrive, ShieldAlert } from "lucide-react";

export default function EdgeManagerPage() {
  const [script, setScript] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // In a real scenario we might pass tenantId, but the API handles via session ideally
      const res = await fetch("/api/agent/install?tenantId=test-tenant");
      if (res.ok) {
        const data = await res.json();
        setScript(data.script);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!script) return;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciador de Borda</h1>
        <p className="text-foreground/60 mt-1">
          Implante Agentes Locais na sua infraestrutura para coleta de backups via FTP.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex items-start gap-6 relative z-10">
          <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0">
            <HardDrive className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Agente Local (Zero Trust)</h2>
            <p className="text-foreground/70 mt-2 leading-relaxed">
              O Agente Local roda diretamente na sua VM (Ubuntu/Debian) via Docker. Ele levanta um servidor FTP passivo isolado que escuta seus roteadores MikroTik/Huawei. Os arquivos são processados e enviados para nossa nuvem via S3 sem que a nuvem tenha acesso às credenciais do seu roteador.
            </p>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-6 inline-flex items-center justify-center py-3 px-6 rounded-xl text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background transition-all duration-200 hover-glass disabled:opacity-50"
            >
              <Terminal className="mr-2 h-4 w-4" />
              {loading ? "Gerando..." : "Gerar Instalador Seguro"}
            </button>
          </div>
        </div>
      </div>

      {script && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              Execute este comando na raiz da sua VM Linux. Este comando contém um token exclusivo do seu provedor. Não compartilhe publicamente.
            </p>
          </div>

          <div className="relative group">
            <div className="absolute flex items-center top-4 right-4 z-10">
              <button
                onClick={copyToClipboard}
                className="p-2 rounded-lg bg-card/80 backdrop-blur hover:bg-card border border-border text-foreground/70 hover:text-foreground transition-all"
                title="Copiar comando"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <pre className="bg-[#0d1117] text-[#c9d1d9] p-6 rounded-2xl overflow-x-auto text-sm border border-border/50 shadow-inner font-mono leading-relaxed">
              <code>{script}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
