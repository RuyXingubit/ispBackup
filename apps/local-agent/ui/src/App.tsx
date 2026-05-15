import { useState, useEffect } from 'react';
import { Router, Plus, Shield, Server, Trash2, CheckCircle2, X, Download, Clock, Edit2 } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  ip: string;
  vendor: string;
  sshUser: string;
}

interface Log {
  id: number;
  status: string;
  message: string;
  file_name: string;
  created_at: string;
}

interface BackupFile {
  name: string;
  size: number;
  mtime: string;
}

function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Device State
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [files, setFiles] = useState<BackupFile[]>([]);
  const [activeTab, setActiveTab] = useState<'edit' | 'history' | 'files'>('edit');
  
  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editIp, setEditIp] = useState('');
  const [editVendor, setEditVendor] = useState('MIKROTIK');
  const [editSshUser, setEditSshUser] = useState('');
  const [editSshPassword, setEditSshPassword] = useState('');

  // Add Form State
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [vendor, setVendor] = useState('MIKROTIK');
  const [sshUser, setSshUser] = useState('');
  const [sshPassword, setSshPassword] = useState('');

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/devices');
      const data = await res.json();
      setDevices(data);
    } catch (error) {
      console.error('Failed to fetch devices', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ip, vendor, sshUser, sshPassword })
      });
      setName('');
      setIp('');
      setSshUser('');
      setSshPassword('');
      fetchDevices();
    } catch (error) {
      console.error('Failed to add device', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/devices/${id}`, { method: 'DELETE' });
      if (selectedDevice?.id === id) setSelectedDevice(null);
      fetchDevices();
    } catch (error) {
      console.error('Failed to delete device', error);
    }
  };

  const handleSelectDevice = async (device: Device) => {
    setSelectedDevice(device);
    setActiveTab('edit');
    setEditName(device.name);
    setEditIp(device.ip);
    setEditVendor(device.vendor);
    setEditSshUser(device.sshUser || '');
    setEditSshPassword('');

    // Fetch Logs
    try {
      const logRes = await fetch(`/api/devices/${device.id}/logs`);
      const logData = await logRes.json();
      setLogs(Array.isArray(logData) ? logData : []);
    } catch (err) { console.error(err); setLogs([]); }

    // Fetch Files
    try {
      const fileRes = await fetch(`/api/devices/${device.id}/files`);
      const fileData = await fileRes.json();
      setFiles(Array.isArray(fileData) ? fileData : []);
    } catch (err) { console.error(err); setFiles([]); }
  };

  const handleEditDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    try {
      await fetch(`/api/devices/${selectedDevice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, ip: editIp, vendor: editVendor, sshUser: editSshUser, sshPassword: editSshPassword })
      });
      fetchDevices();
      alert('Equipamento atualizado com sucesso!');
    } catch (error) {
      console.error('Failed to edit device', error);
    }
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto space-y-8 relative">
      <header className="flex items-center gap-4 border-b border-border pb-6">
        <div className="h-12 w-12 bg-primary/20 rounded-xl flex items-center justify-center">
          <Server className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agente Local Zero Trust</h1>
          <p className="text-foreground/60 text-sm mt-1">
            As credenciais salvas aqui permanecem na sua rede local e nunca vão para a nuvem.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Form */}
        <div className="glass-panel p-6 rounded-2xl h-fit">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Adicionar Roteador
          </h2>

          <form onSubmit={handleAddDevice} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Nome de Identificação</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                placeholder="Ex: CCR Core"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Endereço IP</label>
                <input
                  type="text"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                  placeholder="192.168.0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Fabricante</label>
                <select
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="MIKROTIK">MikroTik</option>
                  <option value="HUAWEI">Huawei</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-primary flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4" /> Credenciais Locais
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Usuário SSH/FTP</label>
                  <input
                    type="text"
                    value={sshUser}
                    onChange={(e) => setSshUser(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Senha SSH/FTP</label>
                  <input
                    type="password"
                    value={sshPassword}
                    onChange={(e) => setSshPassword(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 py-3 px-4 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors flex justify-center items-center gap-2 hover-glass"
            >
              <CheckCircle2 className="h-5 w-5" />
              Salvar Localmente
            </button>
          </form>
        </div>

        {/* Device List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Router className="h-5 w-5 text-primary" />
            Equipamentos Monitorados
          </h2>
          
          {loading ? (
            <div className="text-center py-12 text-foreground/50">Carregando dispositivos...</div>
          ) : devices.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl text-center border border-dashed border-border">
              <p className="text-foreground/60">Nenhum equipamento cadastrado neste agente.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {devices.map(device => (
                <div 
                  key={device.id} 
                  onClick={() => handleSelectDevice(device)}
                  className="glass-panel p-4 rounded-xl flex items-center justify-between hover-glass cursor-pointer group border border-border hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-card rounded-lg flex items-center justify-center border border-border">
                      <Router className="h-5 w-5 text-foreground/70" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{device.name}</h3>
                      <p className="text-sm text-foreground/60 flex items-center gap-2">
                        <span className="font-mono bg-card px-1.5 py-0.5 rounded text-xs">{device.ip}</span>
                        • {device.vendor}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(device.id); }}
                    className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Device Details Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border flex justify-between items-center bg-card/80">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Router className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedDevice.name}</h2>
                  <p className="text-sm text-foreground/60">{selectedDevice.ip}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDevice(null)} className="p-2 hover:bg-border rounded-lg text-foreground/60 hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex border-b border-border">
              <button 
                onClick={() => setActiveTab('edit')} 
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'edit' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-foreground/60 hover:text-foreground hover:bg-card'}`}
              >
                <Edit2 className="h-4 w-4" /> Detalhes / Edição
              </button>
              <button 
                onClick={() => setActiveTab('history')} 
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'history' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-foreground/60 hover:text-foreground hover:bg-card'}`}
              >
                <Clock className="h-4 w-4" /> Histórico Local
              </button>
              <button 
                onClick={() => setActiveTab('files')} 
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'files' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-foreground/60 hover:text-foreground hover:bg-card'}`}
              >
                <Download className="h-4 w-4" /> Arquivos Físicos
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {activeTab === 'edit' && (
                <form onSubmit={handleEditDevice} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Nome</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1">Endereço IP</label>
                      <input type="text" value={editIp} onChange={e => setEditIp(e.target.value)} required className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1">Fabricante</label>
                      <select disabled value={editVendor} className="w-full bg-background/50 border border-border rounded-xl px-4 py-2 opacity-70">
                        <option value="MIKROTIK">MikroTik</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Usuário FTP</label>
                    <input type="text" value={editSshUser} onChange={e => setEditSshUser(e.target.value)} required className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Nova Senha (Opcional)</label>
                    <input type="password" value={editSshPassword} onChange={e => setEditSshPassword(e.target.value)} placeholder="Deixe em branco para manter a atual" className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                  </div>
                  <button type="submit" className="w-full mt-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 hover-glass">
                    Salvar Alterações
                  </button>
                </form>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3">
                  {logs.length === 0 ? (
                    <p className="text-center text-foreground/50 py-8">Nenhum evento registrado.</p>
                  ) : (
                    logs.map(log => (
                      <div key={log.id} className="p-4 rounded-xl border border-border bg-background flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{log.file_name || 'Geral'}</p>
                          <p className="text-xs text-foreground/60 mt-1">{log.message}</p>
                          <p className="text-xs text-foreground/40 mt-1">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${log.status === 'SUCCESS' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {log.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'files' && (
                <div className="space-y-3">
                  {files.length === 0 ? (
                    <p className="text-center text-foreground/50 py-8">Nenhum arquivo encontrado no disco.</p>
                  ) : (
                    files.map(f => (
                      <div key={f.name} className="p-4 rounded-xl border border-border bg-background flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium font-mono">{f.name}</p>
                          <p className="text-xs text-foreground/60 mt-1">
                            {formatSize(f.size)} • {new Date(f.mtime).toLocaleString()}
                          </p>
                        </div>
                        <a 
                          href={`/api/backups/download/${selectedDevice.id}/${f.name}`} 
                          download
                          className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
                        >
                          <Download className="h-5 w-5" />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
