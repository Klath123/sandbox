import React, { useState, useEffect } from 'react';
import { 
  History, 
  Download, 
  Fingerprint, 
  Layers,
  Clock3,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Lock,
  Cpu
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
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

const ForensicAudit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
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
      console.log("Fetched logs:", data);
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

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-200 space-y-6 font-mono">
      {/* Header section */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-white flex items-center gap-2 uppercase">
            <History className="text-purple-500" /> Forensic_Audit_Trail
          </h1>
          <p className="text-slate-500 text-[10px] mt-1 tracking-widest uppercase">
            System_Audit_Buffer: 500_Entries | Filtered_View
          </p>
        </div>
        <Button variant="outline" className="border-slate-700 bg-slate-900 text-[10px] gap-2 h-8 font-bold uppercase">
          <Download size={14} /> Export_Session
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/40 p-4 rounded-lg border border-slate-800">
        <div className="space-y-1.5">
          <label className="text-[9px] uppercase font-bold text-slate-500 ml-1 tracking-tighter">Security_Status</label>
          <Select value={filter.blocked_only} onValueChange={(v) => setFilter({...filter, blocked_only: v})}>
            <SelectTrigger className="bg-slate-950 border-slate-700 h-8 text-[11px] uppercase">
              <SelectValue placeholder="All Traffic" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-200 uppercase text-[10px]">
              <SelectItem value="false">All_Traffic</SelectItem>
              <SelectItem value="true">Blocked_Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] uppercase font-bold text-slate-500 ml-1 tracking-tighter">Defense_Layer</label>
          <Select value={filter.layer} onValueChange={(v) => setFilter({...filter, layer: v})}>
            <SelectTrigger className="bg-slate-950 border-slate-700 h-8 text-[11px] uppercase">
              <SelectValue placeholder="Any Layer" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-200 text-[10px] uppercase">
              <SelectItem value="all">Any_Layer</SelectItem>
              <SelectItem value="L1_Sanitization">L1_Sanitization</SelectItem>
              <SelectItem value="L2_Semantic">L2_Semantic</SelectItem>
              <SelectItem value="L3_Policy">L3_Policy</SelectItem>
              <SelectItem value="L4_Output">L4_Output</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] uppercase font-bold text-slate-500 ml-1 tracking-tighter">Audit_Limit</label>
          <Input 
            type="number" 
            className="bg-slate-950 border-slate-700 h-8 text-[11px]" 
            value={filter.limit}
            onChange={(e) => setFilter({...filter, limit: e.target.value})}
          />
        </div>

        <div className="flex items-end">
          <Button onClick={fetchLogs} disabled={loading} className="w-full bg-purple-900/40 hover:bg-purple-800 border border-purple-500/50 text-purple-100 h-8 text-[10px] font-bold uppercase tracking-widest transition-all">
            {loading ? "FETCHING..." : "QUERY_DB"}
          </Button>
        </div>
      </div>

      {/* Audit Timeline */}
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.request_id} className="space-y-px">
            <Card className={`bg-slate-900/60 border-slate-800 hover:border-slate-600 transition-all rounded-none first:rounded-t-lg last:rounded-b-lg group ${expandedId === log.request_id ? 'border-b-transparent' : ''}`}>
              <CardContent className="p-0">
                <div 
                  className="flex items-center cursor-pointer p-4"
                  onClick={() => toggleExpand(log.request_id)}
                >
                  <div className={`w-1 h-8 mr-4 ${log.blocked ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-green-500'}`} />
                  
                  <div className="grid grid-cols-12 gap-4 flex-1 items-center">
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-tighter">Timestamp</p>
                      <p className="text-[11px] text-slate-300 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                      </p>
                    </div>
                    
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-tighter">Correlation_ID</p>
                      <p className="text-[11px] text-blue-400 font-bold">{log.request_id.slice(0, 12)}</p>
                    </div>

                    <div className="col-span-1">
                      <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-tighter">Verdict</p>
                      <span className={log.blocked ? "text-red-500 text-[10px] font-black" : "text-green-500 text-[10px] font-black"}>
                        {log.blocked ? "BLOCK" : "PASS"}
                      </span>
                    </div>

                    <div className="col-span-5">
                      <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-tighter">Payload_Preview</p>
                      <p className="text-[11px] text-slate-400 truncate italic">"{log.user_message}"</p>
                    </div>

                    <div className="col-span-1 text-right">
                      <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-tighter">Latency</p>
                      <p className="text-[11px] text-slate-400">{log.total_ms}ms</p>
                    </div>

                    <div className="col-span-1 flex justify-end">
                      {expandedId === log.request_id ? <ChevronUp size={16}/> : <ChevronDown size={16} className="text-slate-600 group-hover:text-blue-400" />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* EXPANDED CONTENT: Deep Meta Data Display */}
            {expandedId === log.request_id && (
              <div className="bg-black/40 border-x border-b border-slate-800 p-6 space-y-6 rounded-b-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  
                  {/* Layer 1 Sanitization Info */}
                  <LayerDetailCard 
                    title="L1_Sanitization" 
                    data={log.layers?.L1_Sanitization} 
                    icon={<Eye size={14}/>}
                  >
                    {log.layers?.L1_Sanitization?.flags?.map((f, i) => (
                      <div key={i} className="text-[10px] border-l border-red-500 pl-2 mt-2">
                        <p className="text-red-400 font-bold uppercase">{f.category}</p>
                        <p className="text-slate-500 italic">Matched: {f.match_text}</p>
                      </div>
                    ))}
                  </LayerDetailCard>

                  {/* Layer 2 Semantic Info */}
                  <LayerDetailCard 
                    title="L2_Semantic" 
                    data={log.layers?.L2_Semantic} 
                    icon={<Fingerprint size={14}/>}
                  >
                    {log.layers?.L2_Semantic?.faiss?.ran && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">FAISS_SCORE:</span>
                          <span className="text-blue-400 font-bold">{log.layers.L2_Semantic.faiss.score}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full">
                          <div className="bg-blue-500 h-full" style={{width: `${log.layers.L2_Semantic.faiss.score * 100}%`}} />
                        </div>
                      </div>
                    )}
                  </LayerDetailCard>

                  {/* Layer 3 Policy Info */}
                  <LayerDetailCard 
                    title="L3_Policy" 
                    data={log.layers?.L3_Policy} 
                    icon={<ShieldAlert size={14}/>}
                  >
                    {log.layers?.L3_Policy?.triggered_rules?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Rules_Fired:</p>
                        {log.layers.L3_Policy.triggered_rules.map((rule, i) => (
                          <Badge key={i} className="mt-1 bg-red-900/20 text-red-400 border-red-900 text-[9px] block text-center">
                            {rule}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </LayerDetailCard>

                  {/* Layer 4 Output Info */}
                  <LayerDetailCard 
                    title="L4_Output" 
                    data={log.layers?.L4_Output} 
                    icon={<Lock size={14}/>}
                  >
                    {log.layers?.L4_Output?.redacted && (
                      <Badge className="mt-2 bg-yellow-900/20 text-yellow-500 border-yellow-800 text-[9px] w-full text-center">
                        PII_DETECTED_&_CLEANED
                      </Badge>
                    )}
                  </LayerDetailCard>
                </div>

                {/* Response Preview Block (if not blocked) */}
                {!log.blocked && (
                  <div className="border-t border-slate-800 pt-4">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-blue-400 uppercase">
                      <Cpu size={12}/> Model_Output_Preview
                    </div>
                    <div className="p-4 bg-slate-900/80 rounded border border-blue-900/30 text-[12px] text-slate-300 font-sans leading-relaxed">
                      {log.response_preview || "N/A"}
                    </div>
                  </div>
                )}

                {/* Session Context Metadata */}
                <div className="flex gap-4 pt-2 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                  <span>Model: {log.model}</span>
                  <span>Session: {log.session_id}</span>
                  <span>Role: {log.user_role}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Internal sub-component for Layer metadata
const LayerDetailCard = ({ title, data, icon, children }) => {
  if (!data) return (
    <div className="p-3 border border-slate-800 rounded opacity-30">
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase mb-2">
        {icon} {title}
      </div>
      <div className="text-[9px] italic uppercase tracking-tighter">Layer_Skipped</div>
    </div>
  );

  return (
    <div className={`p-3 border rounded transition-all ${data.blocked ? 'border-red-900/50 bg-red-950/10' : 'border-slate-800 bg-slate-900/40'}`}>
      <div className={`flex items-center gap-2 text-[10px] font-bold uppercase mb-2 ${data.blocked ? 'text-red-400' : 'text-slate-400'}`}>
        {icon} {title}
      </div>
      <div className="flex justify-between items-center text-[10px]">
        <span className="text-slate-500">Latency:</span>
        <span className="text-slate-300">{data.processing_ms}ms</span>
      </div>
      <div className="flex justify-between items-center text-[10px] mt-1">
        <span className="text-slate-500">Verdict:</span>
        <span className={data.blocked ? "text-red-500 font-black" : "text-green-500 font-black"}>
          {data.blocked ? "DENY" : "ALLOW"}
        </span>
      </div>
      {children}
    </div>
  );
};

export default ForensicAudit;