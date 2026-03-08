import React, { useState, useEffect } from 'react';
import {
  Shield, Clock, AlertTriangle, CheckCircle2, XCircle,
  Activity, Cpu, Wifi, WifiOff, Key, KeyRound, Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const LAYER_META = {
  L1_Sanitization: { label: 'Sanitization', color: '#3b82f6', accent: 'blue' },
  L2_Semantic:     { label: 'Semantic',     color: '#8b5cf6', accent: 'purple' },
  L3_Policy:       { label: 'Policy',       color: '#ec4899', accent: 'pink' },
  L4_Output:       { label: 'Output',       color: '#f43f5e', accent: 'rose' },
};

const fmt = (n, dec = 1) => (n == null ? '—' : Number(n).toFixed(dec));
const fmtUptime = (s) => {
  if (!s) return '0s';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return [h && `${h}h`, m && `${m}m`, `${sec}s`].filter(Boolean).join(' ');
};

const Stat = ({ label, value, sub, color = 'text-white' }) => (
  <div className="flex flex-col items-center text-center">
    <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{label}</div>
    {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
  </div>
);

const CommandCenter = () => {
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, hRes] = await Promise.all([
          fetch('http://localhost:8000/metrics'),
          fetch('http://localhost:8000/health'),
        ]);
        const metricsData = await mRes.json();
        const healthData = await hRes.json();
        setMetrics(metricsData);
        setHealth(healthData);
        setLastUpdated(new Date());
        setError(false);
      } catch (err) {
        console.error('Backend unreachable:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-blue-500 animate-pulse font-mono text-lg tracking-widest">
        INITIALIZING VAJRA SYSTEMS...
      </div>
    </div>
  );

  const chartData = Object.entries(metrics?.blocks_by_layer || {}).map(([key, value]) => ({
    name: key.split('_')[0],
    fullName: key,
    blocks: value,
    color: LAYER_META[key]?.color ?? '#64748b',
  }));

  const noTraffic = !metrics?.total;
  const allLayersLoaded = health?.layers_missing?.length === 0;

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-200 space-y-5 font-sans">

      {/* ── Header ── */}
      <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Shield className="text-blue-500" size={22} />
            VAJRA COMMAND CENTER
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">
            Real-time LLM Gateway Defense  •  v{health?.version ?? '—'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Gemini Key */}
          <Badge variant="outline" className={`px-3 py-1 text-xs font-mono gap-1 flex items-center ${health?.gemini_key_set ? 'border-emerald-600 text-emerald-400' : 'border-red-600 text-red-400'}`}>
            {health?.gemini_key_set ? <Key size={11} /> : <KeyRound size={11} />}
            GEMINI KEY {health?.gemini_key_set ? 'SET' : 'MISSING'}
          </Badge>
          {/* System Status */}
          <Badge variant="outline" className={`px-3 py-1 text-xs font-mono flex items-center gap-1 ${error ? 'border-red-500 text-red-400' : 'border-green-500 text-green-400'}`}>
            {error ? <WifiOff size={11} /> : <Wifi size={11} />}
            {error ? 'BACKEND OFFLINE' : health?.status?.toUpperCase() ?? 'UNKNOWN'}
          </Badge>
          {lastUpdated && (
            <span className="text-[10px] text-slate-600 font-mono">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* ── Row 1: Layer Status Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(LAYER_META).map(([key, meta]) => {
          const detail = health?.layer_detail?.[key];
          const isMissing = health?.layers_missing?.includes(key);
          const blockCount = metrics?.blocks_by_layer?.[key] ?? 0;
          const totalBlocked = metrics?.blocked || 1;
          const pct = Math.round((blockCount / totalBlocked) * 100);

          return (
            <Card key={key} className={`bg-slate-900 border ${isMissing ? 'border-red-800/60' : 'border-slate-800'}`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase">{key.split('_')[0]}</p>
                  <CardTitle className="text-sm font-bold text-slate-100">{meta.label}</CardTitle>
                </div>
                {isMissing
                  ? <XCircle className="text-red-500 shrink-0" size={18} />
                  : <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />}
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="flex items-center justify-between text-[10px]">
                  <span className={isMissing ? 'text-red-400' : 'text-emerald-400'}>
                    {isMissing ? 'OFFLINE' : 'ACTIVE'}
                  </span>
                  <span className="text-slate-500 font-mono">{blockCount} blocks</span>
                </div>
                <Progress
                  value={noTraffic ? 0 : pct}
                  className="h-1"
                  style={{ '--progress-color': meta.color }}
                />
                {isMissing && detail?.error && (
                  <p className="text-[9px] text-red-400/80 font-mono truncate" title={detail.error}>
                    ⚠ {detail.error}
                  </p>
                )}
                {!isMissing && detail?.class && (
                  <p className="text-[9px] text-slate-600 font-mono">{detail.class}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Row 2: Traffic Summary + Uptime ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="bg-slate-900 border-slate-800 col-span-2 sm:col-span-4 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Timer size={12} /> UPTIME & TRAFFIC
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Stat label="Uptime" value={fmtUptime(metrics?.uptime_s)} color="text-blue-400" />
            <Stat label="Total Requests" value={metrics?.total ?? 0} color="text-white" />
            <Stat label="Blocked" value={metrics?.blocked ?? 0} color="text-red-400" />
            <Stat label="Passed" value={metrics?.passed ?? 0} color="text-emerald-400" />
          </CardContent>
        </Card>

        {/* Security Pulse */}
        <Card className="bg-slate-900 border-slate-800 col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <AlertTriangle size={12} className="text-yellow-500" /> BLOCK RATE
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-2 pt-1">
            <div className={`text-5xl font-black ${metrics?.block_rate_pct > 50 ? 'text-red-500' : metrics?.block_rate_pct > 20 ? 'text-yellow-400' : 'text-emerald-400'}`}>
              {fmt(metrics?.block_rate_pct)}%
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Global Block Rate</p>
            <div className="w-full space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>THREAT</span>
                <span>CLEAN</span>
              </div>
              <Progress value={metrics?.block_rate_pct ?? 0} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        {/* Avg Latency */}
        <Card className="bg-slate-900 border-slate-800 col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Activity size={12} className="text-blue-500" /> AVG LATENCY
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-1 pt-1">
            <div className="text-5xl font-black text-blue-400 font-mono">
              {fmt(metrics?.avg_ms, 0)}<span className="text-xl text-slate-500">ms</span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Average Response</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Latency Percentiles + Block Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Latency Percentiles */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
              <Clock size={15} className="text-blue-500" /> LATENCY PERCENTILES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
              <div>
                <div className="text-3xl font-mono font-bold text-white">{fmt(metrics?.p50_ms)}<span className="text-sm text-slate-500">ms</span></div>
                <p className="text-[10px] text-slate-500 mt-1 uppercase">P50 Median</p>
              </div>
              <div className="border-x border-slate-800">
                <div className="text-3xl font-mono font-bold text-blue-400">{fmt(metrics?.p95_ms)}<span className="text-sm text-slate-500">ms</span></div>
                <p className="text-[10px] text-slate-500 mt-1 uppercase">P95 Tail</p>
              </div>
              <div>
                <div className="text-3xl font-mono font-bold text-red-400">{fmt(metrics?.p99_ms)}<span className="text-sm text-slate-500">ms</span></div>
                <p className="text-[10px] text-slate-500 mt-1 uppercase">P99 Worst</p>
              </div>
            </div>
            {/* Visual bar comparison */}
            <div className="space-y-2">
              {[
                { label: 'P50', val: metrics?.p50_ms, max: metrics?.p99_ms, color: 'bg-slate-400' },
                { label: 'P95', val: metrics?.p95_ms, max: metrics?.p99_ms, color: 'bg-blue-500' },
                { label: 'P99', val: metrics?.p99_ms, max: metrics?.p99_ms, color: 'bg-red-500' },
                { label: 'AVG', val: metrics?.avg_ms,  max: metrics?.p99_ms, color: 'bg-yellow-500' },
              ].map(({ label, val, max, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 w-7">{label}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${color} transition-all duration-700`}
                      style={{ width: max ? `${(val / max) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 w-14 text-right">{fmt(val, 0)}ms</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Blocks by Layer Chart */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
              <Shield size={15} className="text-purple-500" /> BLOCKS BY LAYER
            </CardTitle>
          </CardHeader>
          <CardContent>
            {noTraffic || chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-600 font-mono text-sm">
                NO TRAFFIC DATA YET
              </div>
            ) : (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barCategoryGap="30%">
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 6 }}
                        itemStyle={{ color: '#f8fafc' }}
                        formatter={(val, _, props) => [`${val} blocks`, props.payload.fullName]}
                        labelFormatter={() => ''}
                      />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} allowDecimals={false} />
                      <Bar dataKey="blocks" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-3">
                  {chartData.map((entry) => (
                    <div key={entry.fullName} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-[10px] text-slate-400 font-mono">{entry.fullName}: {entry.blocks}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Footer: Timestamp ── */}
      <div className="text-[10px] text-slate-700 font-mono text-right pt-2 border-t border-slate-900">
        API TIMESTAMP: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : '—'}
        {' '}•{' '}
        POLLING INTERVAL: 5s
      </div>
    </div>
  );
};

export default CommandCenter;