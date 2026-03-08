import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  Terminal, 
  Activity,
  ChevronRight,
  Filter
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const ThreatFeed = () => {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const scrollRef = useRef(null);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8000/logs/stream');

    eventSource.onopen = () => setConnectionStatus('live');
    
    eventSource.onmessage = (event) => {
      const newEntry = JSON.parse(event.data);
      if (newEntry.type === 'connected') return;

      setLogs((prev) => [newEntry, ...prev].slice(0, 100)); // Buffer last 100 events
    };

    eventSource.onerror = () => {
      setConnectionStatus('reconnecting');
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  const openInspector = (log) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-200 font-mono">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            connectionStatus === 'live' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500'
          }`} />
          <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <Terminal size={20} className="text-blue-500" /> LIVE_THREAT_STREAM
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-slate-900 border-slate-700 text-slate-400">
            AUTO_SCROLL: ON
          </Badge>
          <span className="text-[10px] text-slate-500">CONN_STATUS: {connectionStatus.toUpperCase()}</span>
        </div>
      </div>

      {/* Main Feed Table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-3 bg-slate-900 border-b border-slate-800 text-[10px] uppercase text-slate-500 font-bold tracking-widest">
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-2">Request ID</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-5">Input Message Preview</div>
          <div className="col-span-1 text-right">Latency</div>
          <div className="col-span-1 text-center">Inspect</div>
        </div>

        <ScrollArea className="h-[calc(100vh-220px)]">
          {logs.length === 0 ? (
            <div className="p-20 text-center text-slate-600 italic">Waiting for incoming traffic...</div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.request_id}
                onClick={() => openInspector(log)}
                className={`grid grid-cols-12 gap-4 p-3 border-b border-slate-800/50 items-center hover:bg-blue-500/5 transition-colors cursor-pointer group ${
                  log.blocked ? 'bg-red-500/5' : ''
                }`}
              >
                <div className="col-span-2 text-[11px] text-slate-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <div className="col-span-2 text-[11px] text-blue-400 font-bold tracking-tighter">
                  {log.request_id}
                </div>
                <div className="col-span-1">
                  {log.blocked ? (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-[9px] px-1 py-0">BLOCKED</Badge>
                  ) : (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-[9px] px-1 py-0">PASSED</Badge>
                  )}
                </div>
                <div className="col-span-5 text-sm text-slate-300 truncate font-sans">
                  {log.user_message}
                </div>
                <div className="col-span-1 text-right text-xs text-slate-500 font-mono">
                  {log.total_ms}ms
                </div>
                <div className="col-span-1 flex justify-center">
                  <Eye size={14} className="text-slate-600 group-hover:text-blue-400" />
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Side Inspector Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] bg-slate-900 border-slate-800 text-slate-200 overflow-y-auto font-mono">
          <SheetHeader className="mb-6 border-b border-slate-800 pb-4">
            <SheetTitle className="text-blue-400 flex items-center gap-2 uppercase tracking-tighter">
              <Activity size={18} /> Trace Inspector
            </SheetTitle>
            <SheetDescription className="text-slate-500">
              Request Correlation ID: {selectedLog?.request_id}
            </SheetDescription>
          </SheetHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Decision Section */}
              <div className={`p-4 rounded border ${
                selectedLog.blocked ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase">Final Verdict</span>
                  <span className={selectedLog.blocked ? 'text-red-500' : 'text-green-500'}>
                    {selectedLog.blocked ? 'ACCESS DENIED' : 'ACCESS GRANTED'}
                  </span>
                </div>
                {selectedLog.blocked_at && (
                  <p className="text-xs text-slate-300">
                    Intercepted by <span className="font-bold text-white">{selectedLog.blocked_at}</span>
                  </p>
                )}
              </div>

              {/* Raw JSON Block */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Pipeline Metadata (Raw)</span>
                <pre className="p-4 bg-black/50 rounded-lg text-[11px] text-blue-300 overflow-x-auto border border-slate-800 leading-relaxed">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ThreatFeed;