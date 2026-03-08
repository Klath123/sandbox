import React, { useState } from 'react';
import { 
  Send, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Fingerprint, 
  Lock, 
  User, 
  Bot,
  Zap,
  ChevronDown,
  Info
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const VajraPlayground = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const testPrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "gemini-2.0-flash",
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error("Playground error", err);
    } finally {
      setLoading(false);
    }
  };

  const meta = response?.vajra_metadata;
  const isBlocked = meta?.blocked;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-screen bg-slate-950 font-mono">
      
      {/* Left Column: Input Workbench */}
      <div className="p-8 border-r border-slate-800 flex flex-col space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-black text-blue-400 tracking-tighter flex items-center gap-2 uppercase">
            <Zap size={20} fill="currentColor" /> Input_Workbench
          </h2>
          <p className="text-xs text-slate-500 font-sans">
            Submit adversarial prompts to test gateway enforcement layers.
          </p>
        </div>

        <div className="flex-1 flex flex-col space-y-4">
          <div className="relative group flex-1">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <Textarea 
              className="relative w-full h-full bg-slate-900 border-slate-800 text-slate-100 focus:border-blue-500 rounded-lg p-4 resize-none leading-relaxed"
              placeholder="Enter malicious payload or benign prompt..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={testPrompt}
            disabled={loading || !prompt}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            {loading ? "Analyzing Pipeline..." : "Execute Defense Chain"} <Send size={16} />
          </Button>
        </div>

        <div className="p-4 rounded-lg bg-blue-900/10 border border-blue-900/30">
            <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Info size={12} /> Test Templates
            </h4>
            <div className="flex flex-wrap gap-2">
                {['Prompt Injection', 'PII Leakage', 'Jailbreak', 'SQLi'].map(t => (
                    <button key={t} className="px-2 py-1 rounded bg-slate-800 text-[9px] text-slate-400 hover:bg-slate-700 transition-colors uppercase font-bold border border-slate-700">
                        {t}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Right Column: Security Trace Visualization */}
      <div className="p-8 bg-black/20 flex flex-col space-y-6 overflow-y-auto">
        <div className="space-y-2">
          <h2 className="text-xl font-black text-purple-400 tracking-tighter flex items-center gap-2 uppercase">
            <Search size={20} /> Security_Trace
          </h2>
          <p className="text-xs text-slate-500 font-sans italic">
            Decision Path: {loading ? "TRACING..." : (response ? "COMPLETE" : "WAITING_FOR_INPUT")}
          </p>
        </div>

        {loading ? (
            <div className="flex-1 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        ) : response ? (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-8 relative">
                {/* Visual Connector Line */}
                <div className="absolute left-6 top-4 bottom-4 w-px bg-slate-800" />

                {/* Layer 1: Sanitization */}
                <DefenseStep 
                    name="L1: Sanitization" 
                    status={meta?.blocked_by === 'L1_Sanitization' ? 'BLOCKED' : 'CLEAN'} 
                    detail={meta?.detail?.reason || "Normalization complete. No patterns matched."}
                />

                {/* Layer 2: Semantic */}
                <DefenseStep 
                    name="L2: Semantic Filter" 
                    status={meta?.blocked_by === 'L2_Semantic' ? 'BLOCKED' : 'CLEAN'} 
                    detail={meta?.detail?.reason || "FAISS search complete. Low intent similarity."}
                    score={meta?.detail?.faiss?.score}
                />

                {/* Final Verdict Badge */}
                <div className="relative z-10 flex flex-col items-center py-6">
                    <div className={`p-4 rounded-full border-2 ${isBlocked ? 'bg-red-950 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-green-950 border-green-500 text-green-500'}`}>
                        {isBlocked ? <ShieldAlert size={40} strokeWidth={3}/> : <ShieldCheck size={40} strokeWidth={3}/>}
                    </div>
                    <h3 className={`mt-4 text-2xl font-black ${isBlocked ? 'text-red-500' : 'text-green-500'} tracking-tighter uppercase`}>
                        {isBlocked ? "Threat Neutralized" : "Safe for Model"}
                    </h3>
                </div>

                {/* LLM Response Preview */}
                {!isBlocked && (
                    <Card className="bg-slate-900 border-blue-900/50 relative z-10">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
                                <Bot size={14} /> Gemini_Response
                            </div>
                            <div className="text-sm text-slate-300 font-sans leading-relaxed">
                                {response?.choices?.[0]?.message?.content}
                            </div>
                            {meta?.pii_redacted && (
                                <Badge className="mt-3 bg-yellow-500/10 text-yellow-500 border-yellow-900 text-[10px]">
                                    <Lock size={10} className="mr-1"/> PII_REDACTED
                                </Badge>
                            )}
                        </CardContent>
                    </Card>
                )}
              </div>
            </ScrollArea>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-700 opacity-50">
                <ShieldAlert size={60} strokeWidth={1} />
                <p className="mt-4 text-sm font-bold uppercase tracking-widest italic">Awaiting Payload Execution</p>
            </div>
        )}
      </div>
    </div>
  );
};

const DefenseStep = ({ name, status, detail, score }) => (
    <div className="relative z-10 flex gap-6 items-start">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 shrink-0 ${
            status === 'BLOCKED' ? 'bg-red-950 border-red-500 text-red-500' : 'bg-slate-900 border-slate-700 text-slate-500'
        }`}>
            {status === 'BLOCKED' ? <Lock size={20} /> : <ShieldCheck size={20} />}
        </div>
        <div className="space-y-1 pt-1">
            <h4 className={`text-xs font-black uppercase tracking-widest ${status === 'BLOCKED' ? 'text-red-400' : 'text-slate-200'}`}>
                {name} <span className="ml-2 font-mono text-slate-500">— {status}</span>
            </h4>
            <p className="text-xs text-slate-500 font-sans italic leading-tight max-w-[280px]">
                {detail}
            </p>
            {score && (
                <div className="mt-2 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full" style={{ width: `${score * 100}%` }} />
                </div>
            )}
        </div>
    </div>
);

export default VajraPlayground;