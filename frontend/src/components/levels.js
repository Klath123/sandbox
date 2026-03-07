export const levels = [
  {
    level: 1,
    name: "Basic Security Hygiene",
    desc: "Minimum protections required before deploying AI systems. These foundational controls establish the baseline security posture.",
    icon: "🛡️",
    precautions: [
      {
        title: "Avoid Storing Sensitive Data in LLM Context",
        description: "Implement strict data minimization practices to prevent sensitive information from reaching LLM contexts.",
        risk: [
          "Prompt injection leading to sensitive data extraction",
          "Internal PII/PHI leakage through model responses",
          "Credential exposure in conversation history",
          "Training data contamination with secrets",
          "Compliance violations (GDPR, HIPAA, PCI-DSS)"
        ],
        mitigation: "Use data sanitization, context filtering, and implement PII redaction before sending to LLM.",
        compliance: ["GDPR Art. 25", "ISO 27001 A.8.2.3"]
      },
      {
        title: "Strong Access Control (RBAC / MFA)",
        description: "Implement granular role-based access control with mandatory multi-factor authentication.",
        risk: [
          "Unauthorized AI system access by internal threat actors",
          "API key abuse and credential sharing",
          "Privilege escalation through misconfigured permissions",
          "Account takeover via weak authentication",
          "Compliance failures in audit requirements"
        ],
        mitigation: "Enforce MFA, implement least privilege, and conduct regular access reviews.",
        compliance: ["NIST 800-53 AC-2", "SOC2 CC6.1"]
      },
      {
        title: "Secure Secret Management",
        description: "Centralized management of API keys, tokens, and credentials using vault solutions.",
        risk: [
          "Credential leaks in source code or logs",
          "Repository exposure through public GitHub commits",
          "Insider threats accessing production secrets",
          "Hardcoded secrets in container images",
          "Compromised CI/CD pipeline secret exposure"
        ],
        mitigation: "Use HashiCorp Vault, AWS Secrets Manager, or similar with automatic rotation.",
        compliance: ["ISO 27001 A.9.4.3", "CIS Control 6.2"]
      },
      {
        title: "Dependency & Framework Updates",
        description: "Regular vulnerability scanning and patching of AI frameworks and dependencies.",
        risk: [
          "Known CVEs in LangChain, LlamaIndex, or similar frameworks",
          "SDK vulnerabilities in OpenAI/Anthropic client libraries",
          "Remote code execution via compromised packages",
          "Supply chain attacks on ML dependencies",
          "Outdated model libraries with security flaws"
        ],
        mitigation: "Automated dependency scanning with Dependabot, Snyk, or similar.",
        compliance: ["OWASP TOP 10 A9", "PCI DSS 6.2"]
      },
      {
        title: "Basic Input Sanitization",
        description: "Implement fundamental input validation and sanitization for all user prompts.",
        risk: [
          "Cross-site scripting (XSS) in prompt responses",
          "SQL injection via prompt content",
          "Command injection through system prompts",
          "Unicode normalization attacks",
          "Buffer overflow attempts in prompts"
        ],
        mitigation: "Implement allowlists, encode outputs, and validate input length/type.",
        compliance: ["OWASP ASVS 5.1", "CWE-79"]
      },
      {
        title: "Secure Configuration Management",
        description: "Hardened default configurations for AI services and infrastructure.",
        risk: [
          "Default credentials left unchanged",
          "Debug mode enabled in production",
          "Overly permissive CORS policies",
          "Unencrypted internal communications",
          "Excessive logging of sensitive data"
        ],
        mitigation: "Infrastructure as code with security baselines, regular config audits.",
        compliance: ["CIS Benchmarks", "NIST 800-53 CM-6"]
      },
      {
        title: "Audit Logging Basics",
        description: "Essential logging of access and critical events for security monitoring.",
        risk: [
          "Undetected unauthorized access attempts",
          "Inability to trace security incidents",
          "Compliance violations for audit requirements",
          "Missing forensic evidence after breach",
          "Regulatory penalties for inadequate logging"
        ],
        mitigation: "Centralized logging with retention policies and integrity protection.",
        compliance: ["PCI DSS 10.2", "ISO 27001 A.12.4.1"]
      }
    ]
  },

  {
    level: 2,
    name: "Infrastructure Security",
    desc: "Protection for AI infrastructure, APIs, and supporting systems. Focuses on operational security controls.",
    icon: "🏗️",
    precautions: [
      {
        title: "Protect Internal APIs",
        description: "Secure internal and external APIs with authentication, authorization, and encryption.",
        risk: [
          "Automated API scanning by attackers",
          "Unauthorized endpoint access via exposed APIs",
          "Service exploitation through API vulnerabilities",
          "Data exfiltration through unauthenticated endpoints",
          "API key leakage in client-side code"
        ],
        mitigation: "API gateway with authentication, rate limiting, and mTLS for internal services.",
        compliance: ["OWASP API Security Top 10", "NIST 800-204"]
      },
      {
        title: "Rate Limiting & Abuse Protection",
        description: "Implement intelligent rate limiting and abuse detection for AI services.",
        risk: [
          "Automated prompt injection brute-forcing",
          "Prompt flooding causing resource exhaustion",
          "Denial of service through token exhaustion",
          "Financial impact from excessive API usage",
          "Credential stuffing attacks on auth endpoints"
        ],
        mitigation: "Adaptive rate limiting, token bucket algorithms, and behavioral analysis.",
        compliance: ["PCI DSS 11.3", "OWASP AppSensor"]
      },
      {
        title: "Logging & Monitoring Infrastructure",
        description: "Comprehensive logging and real-time monitoring of AI system behavior.",
        risk: [
          "Undetected system attacks and intrusions",
          "Delayed incident response to active breaches",
          "Invisible misuse patterns and abuse",
          "Missing forensic evidence for investigations",
          "Compliance violations for audit requirements"
        ],
        mitigation: "SIEM integration, real-time alerting, and anomaly detection.",
        compliance: ["ISO 27001 A.12.4.3", "NIST 800-53 AU-6"]
      },
      {
        title: "Input Validation & Prompt Limits",
        description: "Advanced validation and structural limits on user prompts.",
        risk: [
          "Unicode prompt obfuscation bypassing filters",
          "Large prompts causing context window overflow",
          "Encoded injection attempts (base64, hex)",
          "Jailbreak attempts through prompt engineering",
          "Resource exhaustion via massive prompts"
        ],
        mitigation: "Multi-layer validation, token counting, and structural analysis.",
        compliance: ["OWASP ASVS 5.3", "NIST AI RMF 4.2"]
      },
      {
        title: "Network Security Controls",
        description: "Segmentation and protection of AI infrastructure networks.",
        risk: [
          "Lateral movement from compromised services",
          "Data exfiltration through open network paths",
          "Model theft via network sniffing",
          "DDoS attacks on inference endpoints",
          "Man-in-the-middle attacks on API calls"
        ],
        mitigation: "Network segmentation, WAF, DDoS protection, and encrypted traffic.",
        compliance: ["NIST 800-53 SC-7", "CIS Control 12"]
      },
      {
        title: "Container Security",
        description: "Secure deployment and runtime protection for containerized AI workloads.",
        risk: [
          "Vulnerable container images in production",
          "Privilege escalation within containers",
          "Container breakout to host system",
          "Supply chain attacks on base images",
          "Secrets exposure in container layers"
        ],
        mitigation: "Image scanning, minimal base images, and runtime security monitoring.",
        compliance: ["NIST SP 800-190", "CIS Docker Benchmark"]
      },
      {
        title: "Backup & Recovery",
        description: "Secure backup and disaster recovery for AI systems and data.",
        risk: [
          "Ransomware encryption of critical AI data",
          "Model corruption requiring rollback",
          "Configuration loss after incidents",
          "Permanent data loss from system failures",
          "Extended downtime during recovery"
        ],
        mitigation: "Immutable backups, tested recovery procedures, and version control.",
        compliance: ["ISO 27001 A.12.3.1", "NIST 800-53 CP-9"]
      }
    ]
  },

  {
    level: 3,
    name: "Advanced AI Security",
    desc: "Protection against sophisticated AI manipulation, prompt injection, and agent compromise.",
    icon: "⚡",
    precautions: [
      {
        title: "Sandbox Tool Execution",
        description: "Isolated environment for executing AI-generated code and tool calls.",
        risk: [
          "Remote code execution on production servers",
          "Arbitrary file system access and manipulation",
          "Infrastructure takeover via shell commands",
          "Cryptocurrency mining through tool abuse",
          "Data destruction via malicious operations"
        ],
        mitigation: "Firecracker, gVisor, or similar sandboxing with strict resource limits.",
        compliance: ["NIST 800-53 SC-44", "AWS Well-Architected SEC 9"]
      },
      {
        title: "Regular Security Testing",
        description: "Continuous security assessment including red teaming and adversarial testing.",
        risk: [
          "New prompt injection techniques bypassing defenses",
          "Adversarial prompt attacks on model outputs",
          "Undetected vulnerabilities in AI workflows",
          "Jailbreak methods evolving faster than patches",
          "Business logic flaws in agent implementations"
        ],
        mitigation: "Automated security scanning, LLM red teaming, and bug bounty programs.",
        compliance: ["OWASP LLM Top 10", "NIST AI RMF 5.2"]
      },
      {
        title: "Human Oversight for Critical Actions",
        description: "Mandatory human approval for high-impact automated decisions.",
        risk: [
          "Malicious automated actions without review",
          "Financial manipulation by compromised agents",
          "Database modifications without authorization",
          "Destructive system commands executed automatically",
          "Legal liability from autonomous decisions"
        ],
        mitigation: "Break-glass workflows, approval queues, and audit trails for all actions.",
        compliance: ["GDPR Art. 22", "NIST AI RMF 3.5"]
      },
      {
        title: "Context Isolation",
        description: "Strict separation of contexts to prevent cross-session data leakage.",
        risk: [
          "Hidden prompt extraction across sessions",
          "Sensitive data leakage between users",
          "Context exfiltration through side channels",
          "Conversation history poisoning",
          "Cross-user prompt injection attacks"
        ],
        mitigation: "Session isolation, context encryption, and secure context switching.",
        compliance: ["ISO 27001 A.8.2.1", "FedRAMP AC-3"]
      },
      {
        title: "Adversarial Robustness",
        description: "Defenses against adversarial examples and model manipulation.",
        risk: [
          "Model evasion through adversarial inputs",
          "Confidence score manipulation",
          "Decision boundary exploitation",
          "Model stealing via API queries",
          "Backdoor triggers in training data"
        ],
        mitigation: "Adversarial training, input perturbation detection, and output monitoring.",
        compliance: ["NIST AI RMF 4.3", "MITRE ATLAS"]
      },
      {
        title: "Privacy-Preserving Computation",
        description: "Techniques to protect sensitive data during AI processing.",
        risk: [
          "PII exposure through model responses",
          "Training data extraction via prompt engineering",
          "Membership inference attacks",
          "Model inversion revealing private data",
          "Cross-user data contamination"
        ],
        mitigation: "Differential privacy, federated learning, and homomorphic encryption.",
        compliance: ["GDPR Art. 32", "HIPAA Security Rule"]
      },
      {
        title: "Agent Behavior Monitoring",
        description: "Real-time monitoring and analysis of autonomous agent actions.",
        risk: [
          "Unintended agent loops causing damage",
          "Goal misalignment in complex tasks",
          "Resource exhaustion by runaway agents",
          "Unauthorized tool chaining",
          "Escalating privileges through recursion"
        ],
        mitigation: "Behavioral analytics, action limits, and automatic agent termination.",
        compliance: ["NIST AI RMF 3.3", "EU AI Act Article 14"]
      }
    ]
  },

  {
    level: 4,
    name: "Enterprise AI Security",
    desc: "Ideal security posture for production-scale AI deployments with comprehensive governance and controls.",
    icon: "🏢",
    precautions: [
      {
        title: "Zero Trust Architecture",
        description: "Complete zero trust implementation for all AI services and access.",
        risk: [
          "Lateral movement by compromised accounts",
          "Privilege escalation through service accounts",
          "Insider threats accessing sensitive models",
          "Compromised credentials enabling broad access",
          "API abuse from authenticated sources"
        ],
        mitigation: "Continuous verification, micro-segmentation, and just-in-time access.",
        compliance: ["NIST SP 800-207", "CISA Zero Trust Maturity Model"]
      },
      {
        title: "AI Governance & Compliance",
        description: "Formal governance framework for AI systems with compliance automation.",
        risk: [
          "Regulatory non-compliance penalties",
          "Ethical violations in AI decisions",
          "Undocumented AI systems in production",
          "Bias and fairness issues",
          "Lack of audit trails for regulators"
        ],
        mitigation: "AI inventory, automated compliance checks, and ethics board oversight.",
        compliance: ["EU AI Act", "NIST AI RMF", "ISO 42001"]
      },
      {
        title: "Supply Chain Security",
        description: "Comprehensive security validation of AI supply chain components.",
        risk: [
          "Compromised model weights in registry",
          "Malicious plugins in AI workflows",
          "Trojaned datasets in training pipelines",
          "Counterfeit AI components from untrusted sources",
          "Dependency confusion attacks"
        ],
        mitigation: "SBOM generation, signed models, and verified model registries.",
        compliance: ["EO 14028", "NIST SSDF", "ISO 27036"]
      },
      {
        title: "Advanced Incident Response",
        description: "Specialized incident response capabilities for AI security events.",
        risk: [
          "Slow response to prompt injection outbreaks",
          "Uncontrolled data leaks from compromised models",
          "Prolonged exposure during AI incidents",
          "Containment failure in agent compromises",
          "Forensic gaps in AI attack analysis"
        ],
        mitigation: "AI-specific IR playbooks, automated containment, and forensic tooling.",
        compliance: ["NIST 800-61", "ISO 27035"]
      },
      {
        title: "Continuous Security Validation",
        description: "Automated and continuous security testing of AI systems.",
        risk: [
          "Security drift in production AI",
          "Undetected model poisoning over time",
          "Configuration drift from security baselines",
          "Emerging threats outpacing security updates",
          "Compliance validation gaps"
        ],
        mitigation: "Automated red teaming, chaos engineering, and continuous compliance monitoring.",
        compliance: ["NIST 800-53 CA-8", "PCI DSS 11.3"]
      },
      {
        title: "Data Privacy Engineering",
        description: "Privacy-by-design implementation for all AI data processing.",
        risk: [
          "Privacy regulation violations (GDPR, CCPA)",
          "Cross-border data transfer restrictions",
          "Data subject rights fulfillment failures",
          "Secondary use of sensitive data",
          "Privacy breaches in AI training"
        ],
        mitigation: "Privacy impact assessments, data minimization, and privacy-enhancing technologies.",
        compliance: ["GDPR Chapter 4", "CCPA", "HIPAA Privacy Rule"]
      },
    //   {
    //     title: "AI Resilience & Redundancy",
    //     description: "High-availability and disaster recovery for critical AI services.",
    //     risk: [
    //       "AI service outages impacting business",
    //       "Single points of failure in ML pipelines",
    //       "Model availability degradation",
    //       "Cascading failures across AI services",
    //       "Recovery failures after incidents"
    //     ],
    //     mitigation: "Multi-region deployment, graceful degradation, and automated failover.",
    //     compliance: ["ISO 22301", "NIST 800-34"]
    //   },
      {
        title: "Security Metrics & Reporting",
        description: "Comprehensive security metrics and executive reporting for AI risk.",
        risk: [
          "Inability to measure security posture",
          "Missing risk indicators for AI systems",
          "Poor visibility for security leadership",
          "Inadequate board-level reporting",
          "Regulatory reporting failures"
        ],
        mitigation: "Security scorecards, risk dashboards, and automated reporting.",
        compliance: ["ISO 27004", "NIST 800-55"]
      }
    ]
  }
]