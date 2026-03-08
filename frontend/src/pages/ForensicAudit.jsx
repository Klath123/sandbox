import React, { useState, useEffect } from 'react';
import { 
  Search, 
  History, 
  Filter, 
  Download, 
  ShieldX, 
  Fingerprint, 
  Layers,
  Clock3,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const ForensicAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    limit: 50,
    blocked_only: "false",
    layer: "all"
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:8000/logs?limit=${filter.limit}`;
      if (filter.blocked_only === "true") url += "&blocked_only=true";
      if (filter.layer !== "all") url += `&layer=${filter.layer}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.entries || []);
    } catch (err) {
      console.error("Forensic fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-200 space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="text-purple-500" /> FORENSIC_AUDIT_LOG
          </h1>
          <p className="text-slate-500 text-xs font-mono mt-1">
            QUERY_BUFFER: 500_ENTRIES | SCOPE: HISTORICAL_ANALYSIS
          </p>
        </div>
        <Button variant="outline" className="border-slate-700 bg-slate-900 text-xs gap-2 h-8">
          <Download size={14} /> EXPORT_CSV
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Status Filter</label>
          <Select 
            value={filter.blocked_only} 
            onValueChange={(v) => setFilter({...filter, blocked_only: v})}
          >
            <SelectTrigger className="bg-slate-950 border-slate-700 h-9 text-xs">
              <SelectValue placeholder="All Traffic" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
              <SelectItem value="false">All Traffic</SelectItem>
              <SelectItem value="true">Blocked Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Intercept Layer</label>
          <Select 
            value={filter.layer} 
            onValueChange={(v) => setFilter({...filter, layer: v})}
          >
            <SelectTrigger className="bg-slate-950 border-slate-700 h-9 text-xs">
              <SelectValue placeholder="Any Layer" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
              <SelectItem value="all">Any Layer</SelectItem>
              <SelectItem value="L1_Sanitization">L1 Sanitization</SelectItem>
              <SelectItem value="L2_Semantic">L2 Semantic</SelectItem>
              <SelectItem value="L3_Policy">L3 Policy</SelectItem>
              <SelectItem value="L4_Output">L4 Output</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Result Limit</label>
          <Input 
            type="number" 
            className="bg-slate-950 border-slate-700 h-9 text-xs" 
            value={filter.limit}
            onChange={(e) => setFilter({...filter, limit: e.target.value})}
          />
        </div>

        <div className="flex items-end">
          <Button 
            onClick={fetchLogs} 
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white h-9 text-xs font-bold"
          >
            {loading ? "SEARCHING..." : "RUN_QUERY"}
          </Button>
        </div>
      </div>

      {/* Audit Timeline */}
      <div className="space-y-4">
        {logs.map((log) => (
          <Card key={log.request_id} className="bg-slate-900 border-slate-800 hover:border-slate-600 transition-all overflow-hidden group">
            <div className="flex items-stretch h-full">
              {/* Status Sidebar */}
              <div className={`w-1.5 ${log.blocked ? 'bg-red-500 shadow-[2px_0_10px_rgba(239,68,68,0.3)]' : 'bg-green-500'}`} />
              
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <Fingerprint size={18} className="text-slate-500" />
                    <span className="font-mono text-xs text-blue-400 font-bold">{log.request_id}</span>
                    <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-400">
                      SESSION: {log.session_id?.slice(0,8)}...
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 uppercase">
                    <span className="flex items-center gap-1"><Clock3 size={12}/> {new Date(log.timestamp).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Layers size={12}/> {log.total_ms}ms total</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* User Intent Column */}
                  <div className="col-span-2 space-y-2">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Input Payload</p>
                    <div className="p-3 bg-black/40 rounded border border-slate-800 text-sm italic text-slate-300 font-serif">
                      "{log.user_message}"
                    </div>
                  </div>

                  {/* Security Outcome Column */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Security Verdict</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Decision:</span>
                        <span className={log.blocked ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                          {log.blocked ? "BLOCKED" : "PASSED"}
                        </span>
                      </div>
                      {log.blocked && (
                        <div className="flex items-center justify-between text-xs border-t border-slate-800 pt-2">
                          <span className="text-slate-400">Interception Point:</span>
                          <Badge className="bg-red-500/10 text-red-400 border-red-900 text-[10px]">
                            {log.blocked_at}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expand Button Hint */}
                <div className="mt-4 pt-3 border-t border-slate-800/50 flex justify-end">
                   <button className="text-[10px] text-slate-600 flex items-center gap-1 hover:text-blue-400 transition-colors uppercase font-bold">
                     View Deep Trace Logic <ExternalLink size={10} />
                   </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ForensicAudit;