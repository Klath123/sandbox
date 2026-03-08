import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Zap, 
  History, 
  PlayCircle, 
  Settings, 
  Shield, 
  Activity 
} from 'lucide-react';

// Import the components we built
import CommandCenter from './pages/Dashboard';
import ThreatFeed from './pages/Monitoring';
import ForensicAudit from './pages/ForensicAudit';
import VajraPlayground from './pages/VajraPlayground';
import SystemConfig from './pages/SystemConfig';
import Playground from './pages/Playground';

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'live', label: 'Live Threat Feed', icon: Zap },
    { id: 'audit', label: 'Forensic Audit', icon: History },
    { id: 'playground', label: 'Playground', icon: PlayCircle },
    { id: 'config', label: 'System Config', icon: Settings },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <CommandCenter />;
      case 'live': return <ThreatFeed />;
      case 'audit': return <ForensicAudit />;
      case 'playground': return <Playground />;
      case 'config': return <SystemConfig />;
      default: return <CommandCenter />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 flex flex-col bg-slate-900/50">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Shield size={20} className="text-white" fill="currentColor" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase">Vajra</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                activePage === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <item.icon size={18} className={activePage === item.id ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} />
              <span className="text-sm font-bold uppercase tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gateway Node</span>
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
             </div>
             <div className="text-xs font-mono text-blue-400">VAJRA-PRX-01</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Universal Top Bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">Environment: <span className="text-slate-300">Local_Dev</span></span>
            <span className="text-slate-800">|</span>
            <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">Status: <span className="text-green-500">Normal</span></span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
                <Activity size={12} className="text-blue-400" />
                <span className="text-[10px] font-bold text-slate-300 tracking-tighter uppercase">API Sync Active</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono italic">
                Last Heartbeat: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </header>

        {/* Dynamic Page View */}
        <div className="flex-1 overflow-y-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;