import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const features = [
    {
      title: "Prompt Injection Detection",
      desc: "Detects adversarial prompts using semantic embeddings and vector similarity search."
    },
    {
      title: "Secure LLM Proxy",
      desc: "Acts as a gateway between client applications and LLM APIs, enforcing centralized security."
    },
    {
      title: "Output Data Protection",
      desc: "Prevents sensitive data leaks using PII detection and secret redaction mechanisms."
    }
  ];

  const precautions = [
    {
      title: "Avoid Sensitive Data in Prompts",
      desc: "Organizations should ensure that API keys, credentials, and private data are never placed inside prompts or system instructions."
    },
    {
      title: "Strong Access Control",
      desc: "Implement role-based access control, service authentication, and multi-factor authentication for all AI services."
    },
    {
      title: "Secure API Infrastructure",
      desc: "Protect internal APIs using gateways, token validation, IP allow-listing, and proper request filtering."
    },
    {
      title: "Rate Limiting & Abuse Protection",
      desc: "Prevent automated attacks by limiting the number of requests per user, API key, or IP address."
    },
    {
      title: "Secret Management Systems",
      desc: "Use secure vaults such as AWS Secrets Manager or HashiCorp Vault to manage API keys and credentials."
    },
    {
      title: "Logging & Monitoring",
      desc: "Maintain logs of prompts, blocked injections, tool calls, and system events for security monitoring."
    },
    {
      title: "Sandbox Tool Execution",
      desc: "Run AI tool calls inside isolated environments such as Docker containers to prevent system compromise."
    },
    {
      title: "Regular Security Testing",
      desc: "Perform prompt injection testing, red-team exercises, and vulnerability scans to ensure system resilience."
    },
    {
      title: "Dependency Updates",
      desc: "Keep AI frameworks, SDKs, and backend dependencies updated to mitigate known vulnerabilities."
    },
    {
      title: "Human Oversight for Critical Actions",
      desc: "Sensitive operations like database changes or financial actions should require human approval."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-[#00ff99] relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,_rgba(0,255,100,0.05)_0%,_black_80%)]"></div>
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(90deg,rgba(0,255,100,0.2)_1px,transparent_1px),linear-gradient(rgba(0,255,100,0.2)_1px,transparent_1px)] bg-[size:30px_30px]" />
      </div>

      {/* Animations */}
      <style>
        {`
        @keyframes flicker {
          0%, 18%, 22%, 25%, 53%, 57%, 100% { opacity: 1; }
          20%, 24%, 55% { opacity: 0.4; }
        }

        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        `}
      </style>

      {/* Scan line */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="w-full h-1 bg-[#00ff99]/20 animate-[scan_4s_linear_infinite]"></div>
      </div>

      <div className="relative z-10">

        {/* HERO */}
        <section className="flex flex-col items-center justify-center text-center py-32 px-4">
          <h1 className="text-6xl font-extrabold tracking-widest drop-shadow-[0_0_15px_#00ff99] animate-[flicker_2s_infinite]">
            VAJRA
          </h1>

          <p className="mt-4 text-[#00ff99cc] max-w-xl text-lg font-mono leading-relaxed">
            A Secure LLM Proxy Gateway Against Prompt Injection
          </p>

          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link to="/auth">
              <Button className="bg-[#00ff99] text-black font-semibold hover:bg-[#00e688] hover:scale-105 transition transform shadow-[0_0_15px_#00ff99]">
                ACCESS TERMINAL
              </Button>
            </Link>

            <Button
              variant="outline"
              className="border-[#00ff99] text-[#00ff99] hover:bg-[#00ff9915]"
            >
              VIEW PROTOCOLS
            </Button>
          </div>
        </section>

        {/* FEATURES */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold mb-10 text-center text-[#00ffcc]">
            Core Security Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card
                key={f.title}
                className="bg-[#001a0d]/60 border border-[#00ff99]/10 backdrop-blur-md shadow-[0_0_25px_#00ff9940] hover:shadow-[0_0_35px_#00ff99a0] transition"
              >
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-[#00ffcc] mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[#00ff99bb] font-mono">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* SECURITY REQUIREMENTS */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <h2 className="text-3xl font-bold mb-10 text-center text-[#00ffcc]">
            Organizational Security Requirements Before Deploying VAJRA
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {precautions.map((p) => (
              <Card
                key={p.title}
                className="bg-[#001a0d]/60 border border-[#00ff99]/10 backdrop-blur-md shadow-[0_0_25px_#00ff9940]"
              >
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-[#00ffcc] mb-2">
                    {p.title}
                  </h3>
                  <p className="text-sm text-[#00ff99bb] font-mono">
                    {p.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#00ff99aa] font-mono border-t border-[#00ff99]/10">
        [ SYSTEM STATUS: ONLINE ] • Uptime: 99.999% • Version: v1.0.0 • Classified Access Only
      </footer>
    </div>
  );
}