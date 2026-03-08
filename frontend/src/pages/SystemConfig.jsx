import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  RefreshCw, 
  Layers, 
  Database, 
  Cpu, 
  FileCode, 
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner"; // Assuming you use Sonner for notifications

const SystemConfig = () => {
  const [pipeline, setPipeline] = useState([]);
  const [layerStatus, setLayerStatus] = useState({});
  const [isReloading, setIsReloading] = useState(false);
  const [reloadResult, setReloadResult] = useState(null);

  const fetchConfig = async () => {
    try {
      const res = await fetch('http://localhost:8000/layers');
      const data = await res.json();
      setPipeline(data.pipeline || []);
      setLayerStatus(data.layer_status || {});
    } catch (err) {
      console.error("Config fetch failed", err);
    }
  };

  const handleReload = async () => {
    setIsReloading(true);
    setReloadResult(null);
    try {
      const res = await fetch('http://localhost:8000/admin/reload', { method: 'POST' });
      const data = await res.json();
      setReloadResult(data);
      
      if (data.errors && data.errors.length > 0) {
        toast.error("Reload partial failure: Check YAML syntax.");
      } else {
        toast.success("All security layers reloaded successfully.");
      }
      fetchConfig(); // Refresh status after reload
    } catch (err) {
      toast.error("Failed to connect to admin endpoint.");
    } finally {
      setIsReloading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-200 space-y-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings2 className="text-blue-500" /> SYSTEM_CONFIGURATION
          </h1>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mt-1">
            Engine: VAJRA_CORE_V2.1 | Environment: PRODUCTION
          </p>
        </div>
        <Button 
          onClick={handleReload} 
          disabled={isReloading}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-2 px-6"
        >
          <RefreshCw size={16} className={isReloading ? "animate-spin" : ""} /> 
          {isReloading ? "RELOADING..." : "SYNC_POLICIES"}
        </Button>
      </div>

      {/* Pipeline Visualizer */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardHeader className="border-b border-slate-800/50 bg-slate-900/50">
          <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-tighter text-blue-400">
            <Layers size={16} /> Defense Pipeline Topology
          </CardTitle>
          <CardDescription className="text-[10px] uppercase font-mono text-slate-500">
            Serial Execution Order
          </CardDescription>
        </CardHeader>
        <CardContent className="p-12">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
            {pipeline.map((step, index) => {
              const layerKey = step.split(' ')[0];
              const isOk = layerStatus[layerKey]?.loaded;
              
              return (
                <React.Fragment key={index}>
                  <div className="flex flex-col items-center group">
                    <div className={`w-48 p-4 rounded-xl border-2 transition-all duration-500 flex flex-col items-center text-center gap-3 ${
                      isOk ? 'bg-slate-950 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-red-950/20 border-red-500/50'
                    }`}>
                      <div className={`p-2 rounded-lg ${isOk ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                        {index === 3 ? <Cpu size={24} /> : <ShieldCheck size={24} />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tighter text-slate-300">{step}</span>
                    </div>
                    <Badge variant="outline" className={`mt-2 text-[9px] ${isOk ? 'text-green-500 border-green-900' : 'text-red-500 border-red-900'}`}>
                      {isOk ? 'OPERATIONAL' : 'OFFLINE'}
                    </Badge>
                  </div>
                  {index < pipeline.length - 1 && (
                    <ArrowRight className="hidden lg:block text-slate-700 animate-pulse" size={20} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Error Management & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reload Results */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-xs uppercase font-bold text-slate-500 tracking-widest">Policy Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            {reloadResult?.errors?.length > 0 ? (
              <Alert variant="destructive" className="bg-red-950/20 border-red-900 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs font-bold uppercase">Partial Reload Failure</AlertTitle>
                <AlertDescription className="text-[11px] font-mono mt-1">
                  {reloadResult.errors.map((err, i) => (
                    <div key={i} className="mt-1 border-t border-red-900/50 pt-1">
                      LAYER_{err.layer}: {err.error}
                    </div>
                  ))}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-950/10 border border-green-900/30 text-green-500">
                <CheckCircle2 size={20} />
                <div className="text-xs font-bold uppercase tracking-tight">System fully synchronized with latest YAML policy.</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Assets */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-xs uppercase font-bold text-slate-500 tracking-widest">Configuration Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'patterns.yaml', layer: 'L1', size: '12KB' },
              { name: 'layer2_config.yaml', layer: 'L2', size: '4.2KB' },
              { name: 'policies.yaml', layer: 'L3', size: '8.5KB' }
            ].map(file => (
              <div key={file.name} className="flex items-center justify-between p-3 bg-slate-950 rounded border border-slate-800 group hover:border-blue-500/50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileCode size={16} className="text-slate-500 group-hover:text-blue-400" />
                  <span className="text-xs font-mono text-slate-300">{file.name}</span>
                </div>
                <Badge variant="secondary" className="text-[9px] bg-slate-900 border-slate-800 text-slate-500">{file.layer} CORE</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemConfig;