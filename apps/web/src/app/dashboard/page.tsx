import { prisma } from "@ispbackup/database";
import { Activity, Database, CheckCircle, AlertTriangle } from "lucide-react";
// Next.js App Router: using recharts requires a Client Component for the chart itself.
// We will create a small client component for the chart and import it here.
import DashboardChart from "./DashboardChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch some metrics directly using Prisma
  const totalLogs = await prisma.backupLog.count();
  const successfulLogs = await prisma.backupLog.count({ where: { status: "SUCCESS" } });
  const failedLogs = await prisma.backupLog.count({ where: { status: "FAILED" } });
  
  const recentLogs = await prisma.backupLog.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { device: true },
  });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-foreground/60 mt-1">Monitore o status dos seus backups de borda em tempo real.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-foreground/60">Total de Backups</p>
              <p className="text-3xl font-bold mt-2">{totalLogs}</p>
            </div>
            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
              <Database className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-foreground/60">Sucesso</p>
              <p className="text-3xl font-bold mt-2 text-green-500">{successfulLogs}</p>
            </div>
            <div className="h-10 w-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-500">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-foreground/60">Falhas</p>
              <p className="text-3xl font-bold mt-2 text-red-500">{failedLogs}</p>
            </div>
            <div className="h-10 w-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-foreground/60">Agentes Ativos</p>
              <p className="text-3xl font-bold mt-2">1</p>
            </div>
            <div className="h-10 w-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-6">Volume de Dados (MB)</h2>
          <div className="h-72 w-full">
             <DashboardChart />
          </div>
        </div>

        {/* Logs Table */}
        <div className="glass-panel p-6 rounded-2xl overflow-hidden flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Logs Recentes</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-foreground/60 text-center py-8">Nenhum log encontrado.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-xl bg-card border border-border flex items-center justify-between hover-glass cursor-pointer">
                  <div>
                    <p className="font-medium">{log.device.name}</p>
                    <p className="text-xs text-foreground/60 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{log.fileSizeMb.toFixed(2)} MB</span>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${log.status === 'SUCCESS' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
