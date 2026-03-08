import React, { useState, useEffect } from 'react';
import { Shield, Activity, Clock, AlertTriangle, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CommandCenter = () => {
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, hRes] = await Promise.all([
          fetch('http://localhost:8000/metrics'),
          fetch('http://localhost:8000/health')
        ]);
        setMetrics(await mRes.json());
        setHealth(await hRes.json());
      } catch (err) {
        console.error("Backend unreachable", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Polling every 5s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-blue-500 animate-pulse font-mono">INITIALIZING VAJRA SYSTEMS...</div>;

  // Prepare chart data from blocks_by_layer
  const chartData = Object.entries(metrics?.blocks_by_layer || {}).map(([name, value]) => ({
    name: name.replace('L', 'Layer '),
    blocks: value,
  }));

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-200 space-y-6 font-sans">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Shield className="text-blue-500" /> VAJRA COMMAND CENTER
          </h1>
          <p className="text-slate-400 text-sm italic">Real-time LLM Gateway Defense Status</p>
        </div>
        <Badge variant="outline" className="border-green-500 text-green-500 px-3 py-1">
          SYSTEMS V{health?.version} LIVE
        </Badge>
      </div>

      {/* Row 1: System Status Cards (L1 - L4) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['L1_Sanitization', 'L2_Semantic', 'L3_Policy', 'L4_Output'].map((layer) => {
          const isMissing = health?.layers_missing.includes(layer);
          return (
            <Card key={layer} className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-mono text-slate-400">{layer.split('_')[0]} PROTECTION</CardTitle>
                {isMissing ? <XCircle className="text-red-500" size={16}/> : <CheckCircle2 className="text-green-500" size={16}/>}
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-slate-100">{layer.split('_')[1]}</div>
                <p className="text-[10px] text-slate-500 mt-1 uppercase">
                  {isMissing ? "Offline / Missing Module" : "Active & Enforcing"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Row 2: Security Pulse & Latency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPI: Block Rate */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-500" /> SECURITY PULSE
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="text-5xl font-black text-red-500">{metrics?.block_rate_pct}%</div>
            <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest">Global Block Rate</p>
            <div className="w-full mt-6 space-y-2">
               <div className="flex justify-between text-[10px] text-slate-400">
                  <span>CLEAN TRAFFIC</span>
                  <span>{metrics?.passed} PKTS</span>
               </div>
               <Progress value={100 - metrics?.block_rate_pct} className="h-1 bg-red-900/30" />
            </div>
          </CardContent>
        </Card>

        {/* KPI: Performance Metrics */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock size={16} className="text-blue-500" /> SYSTEM LATENCY (P95)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-mono text-white">{metrics?.p50_ms}ms</div>
                <p className="text-[10px] text-slate-500">P50 (AVG)</p>
              </div>
              <div className="border-x border-slate-800">
                <div className="text-2xl font-mono text-blue-400">{metrics?.p95_ms}ms</div>
                <p className="text-[10px] text-slate-500">P95 (TAIL)</p>
              </div>
              <div>
                <div className="text-2xl font-mono text-red-400">{metrics?.p99_ms}ms</div>
                <p className="text-[10px] text-slate-500">P99 (MAX)</p>
              </div>
            </div>
            <div className="mt-8">
               <p className="text-[10px] text-slate-500 mb-2 uppercase">Layer Effectiveness Distribution</p>
               <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                        itemStyle={{ color: '#f8fafc' }}
                      />
                      <Bar dataKey="blocks" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'][index % 4]} />
                        ))}
                      </Bar>
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommandCenter;