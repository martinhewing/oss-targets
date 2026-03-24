import { useState } from "react";

// ── Status definitions ────────────────────────────────────────────────────────
const STATUS = {
  SHIPPED:   { label: "Shipped",     color: "#00ff88", bg: "rgba(0,255,136,0.08)" },
  IN_REVIEW: { label: "In Review",   color: "#ffcc00", bg: "rgba(255,204,0,0.08)" },
  DRAFTED:   { label: "Drafted",     color: "#64b4ff", bg: "rgba(100,180,255,0.08)" },
  PLANNED:   { label: "Planned",     color: "#b088f9", bg: "rgba(176,136,249,0.08)" },
  CANDIDATE: { label: "Candidate",   color: "#888",    bg: "rgba(136,136,136,0.06)" },
};

// ── Contribution proposals ────────────────────────────────────────────────────
const proposals = [
  {
    id: "CSP-001",
    title: "Text preprocessing hook for TTS transcripts",
    target: { name: "Cartesia Python SDK", repo: "cartesia-ai/cartesia-python" },
    status: STATUS.DRAFTED,
    priority: "P0",
    lastUpdated: "2026-03-24",
    authors: ["martinhewing"],
    overview: "Applications that pipe LLM output into Cartesia TTS must preprocess transcripts to convert notation (LaTeX, Markdown, URLs) into speakable text. The SDK provides no hook or utility for this. Every production user reimplements the same pattern.",
    background: [
      "Our math-olympiad tutor generates content via Claude with LaTeX notation: $n \\geq 8$ renders in KaTeX for display, but must become \"n greater than or equal to 8\" before passing to Cartesia Sonic.",
      "We maintain ~40 lines of regex in _strip_latex() and _latex_to_speech() that run before every tts.bytes() and tts.stream() call.",
      "The SDK is auto-generated from cartesia-ai/docs via Fern, so adding a transcript_preprocessor parameter to the core TTS client is not a viable PR path.",
    ],
    proposal: "File a feature request on cartesia-ai/cartesia-python describing the gap with production code as evidence. Offer to contribute either a cookbook example to cartesia-ai/docs or a contrib preprocessor module if the team prefers that approach.",
    implementation: [
      "Issue drafted with full code listing from our _strip_latex() implementation",
      "Proposed two API shapes: (A) callable on the client, (B) composable contrib module",
      "Live demo link and source repo included as evidence of production usage",
    ],
    evidence: {
      ourFiles: ["voice/tts.py", "routes/voice.py → _strip_latex(), _latex_to_speech()"],
      linesOfCode: "~40 lines of regex preprocessing",
      liveDemo: "https://math-olympiad.connectaiml.com",
    },
    nextSteps: [
      "File the issue on cartesia-ai/cartesia-python",
      "If maintainers prefer a docs PR, submit cookbook example to cartesia-ai/docs",
      "If they accept a contrib module, extract _strip_latex into a reusable package",
    ],
    risks: "SDK is auto-generated — maintainers may prefer to keep preprocessing out of the SDK entirely and point users to a docs example instead. This is an acceptable outcome.",
  },
  {
    id: "CSP-002",
    title: "STT confidence scores for transcript quality gating",
    target: { name: "Cartesia Python SDK", repo: "cartesia-ai/cartesia-python" },
    status: STATUS.SHIPPED,
    priority: "P0",
    lastUpdated: "2026-03-24",
    authors: ["martinhewing"],
    overview: "The Ink STT API supports timestamp_granularities=[\"word\"] which returns word-level timing, but exposes no confidence score. We adopted word timestamps to replace our crude heuristics, and now request confidence data as a follow-up.",
    background: [
      "Our original voice pipeline used len(transcript.split()) < 8 and len(audio_bytes) < 1000 as quality gates — pure heuristics with no signal from the model about transcription certainty.",
      "We discovered the SDK supports timestamp_granularities=[\"word\"], which returns per-word start/end times and total audio duration. We were not using this.",
      "We patched stt.py to request word timestamps and return a structured dict {transcript, words, word_count, duration}. voice.py now uses word_count and duration instead of string splitting and byte counting.",
    ],
    proposal: "Internal code improvement shipped first. The remaining gap — per-word or per-utterance confidence scores — is included in the CSP-001 issue as a related feature request. If confidence data exists internally in the Ink pipeline, exposing it would let applications gate on quality rather than quantity.",
    implementation: [
      "stt.py: added timestamp_granularities=[\"word\"] to client.stt.transcribe()",
      "stt.py: returns structured dict instead of bare string",
      "voice.py: replaced len(transcript.split()) < 8 with word_count < 8",
      "voice.py: added duration < 1.0s guard replacing byte-length heuristic",
      "Committed: feat(voice): use word timestamps from Ink STT for quality gating",
    ],
    evidence: {
      ourFiles: ["voice/stt.py", "routes/voice.py → submit_voice_answer()"],
      linesOfCode: "~30 lines changed across two files",
      liveDemo: "https://math-olympiad.connectaiml.com",
    },
    nextSteps: [
      "Monitor production for false-negative rate on the word_count < 8 threshold",
      "If Cartesia exposes confidence scores, replace threshold with confidence gating",
    ],
    risks: "None — this is an internal improvement. The confidence request is additive to CSP-001.",
  },
  {
    id: "CSP-003",
    title: "Cartesia Ink engine for RealtimeSTT",
    target: { name: "RealtimeSTT", repo: "KoljaB/RealtimeSTT" },
    status: STATUS.PLANNED,
    priority: "P1",
    lastUpdated: "2026-03-24",
    authors: ["martinhewing"],
    overview: "RealtimeSTT supports Whisper, Deepgram, and Azure as STT engines but has no Cartesia Ink backend. The library has a clean engine abstraction. Our stt.py is a working Ink implementation that maps directly onto this interface.",
    background: [
      "RealtimeSTT is a ~3.5k star Python library for real-time speech-to-text with a modular engine architecture.",
      "Cartesia Ink (ink-whisper) is an SSM-based Whisper variant optimised for conversational AI — lower TTCT, better handling of disfluencies and variable-length chunks.",
      "We use Ink directly via the Cartesia SDK. Our transcribe() function handles audio conversion, API calls, and response parsing — essentially the same contract a RealtimeSTT engine must fulfil.",
    ],
    proposal: "Implement a CartesiaEngine class conforming to RealtimeSTT's engine interface. The implementation is a generalisation of our voice/stt.py transcribe() function. Submit as a PR to KoljaB/RealtimeSTT.",
    implementation: [
      "Study the existing engine interface (WhisperEngine, DeepgramEngine) for contract",
      "Extract our Ink integration into a standalone CartesiaEngine class",
      "Add configuration: API key, model selection, language, timestamp options",
      "Write tests against the engine contract using recorded audio fixtures",
      "Submit PR with documentation and a usage example",
    ],
    evidence: {
      ourFiles: ["voice/stt.py → transcribe()", "voice/stt.py → _to_wav()"],
      linesOfCode: "~50 lines of working Ink integration to generalise",
      liveDemo: "https://math-olympiad.connectaiml.com",
    },
    nextSteps: [
      "Review RealtimeSTT engine interface and test patterns",
      "Build CartesiaEngine as a standalone file, test locally",
      "Open issue on KoljaB/RealtimeSTT proposing the addition before submitting PR",
    ],
    risks: "Solo maintainer — response time may vary. Mitigated by opening a discussion issue first.",
  },
  {
    id: "CSP-004",
    title: "Cartesia Sonic engine for RealtimeTTS",
    target: { name: "RealtimeTTS", repo: "KoljaB/RealtimeTTS" },
    status: STATUS.PLANNED,
    priority: "P1",
    lastUpdated: "2026-03-24",
    authors: ["martinhewing"],
    overview: "RealtimeTTS supports Coqui, ElevenLabs, Azure, and System TTS but has no Cartesia Sonic engine. Our tts.py implements both streaming (WebSocket) and batch (generate) modes against Sonic — the exact contract a RealtimeTTS engine requires.",
    background: [
      "RealtimeTTS is the sister project to RealtimeSTT (~2k stars), same maintainer, same modular engine pattern.",
      "Cartesia Sonic is an SSM-based TTS model with ~40ms first-chunk latency via WebSocket streaming.",
      "Our tts.py implements stream_tts() (async generator yielding chunks) and generate_tts() (full audio with disk save). Both modes map onto RealtimeTTS's engine interface.",
      "We also built _audio_and_save() — a dual-write pattern that streams to the client while accumulating chunks for disk persistence.",
    ],
    proposal: "Implement a CartesiaEngine class for RealtimeTTS with streaming and batch modes. Include the text preprocessing hook gap as a documented limitation (see CSP-001). Submit as a PR alongside CSP-003.",
    implementation: [
      "Study ElevenLabsEngine and CoquiEngine for interface contract",
      "Implement CartesiaEngine with stream and generate modes",
      "Add multi-voice support (voice_id switching) — our dual-agent pattern as the use case",
      "Document the text preprocessing gap (no built-in normaliser chain)",
      "Submit PR with tests and usage example",
    ],
    evidence: {
      ourFiles: ["voice/tts.py → stream_tts(), generate_tts()", "routes/voice.py → _audio_and_save()"],
      linesOfCode: "~80 lines of working Sonic integration to generalise",
      liveDemo: "https://math-olympiad.connectaiml.com",
    },
    nextSteps: [
      "Complete CSP-003 first (same maintainer — establishes relationship)",
      "Build CartesiaEngine for TTS following the same pattern",
      "Submit as a paired PR referencing CSP-003",
    ],
    risks: "Dependency on CSP-003 landing first. If CSP-003 is rejected, CSP-004 approach changes.",
  },
  {
    id: "CSP-005",
    title: "Cartesia Ink + Silero VAD integration example",
    target: { name: "Silero VAD", repo: "snakers4/silero-vad" },
    status: STATUS.CANDIDATE,
    priority: "P2",
    lastUpdated: "2026-03-24",
    authors: ["martinhewing"],
    overview: "Silero VAD is the standard open-source voice activity detector (~5k stars) used by faster-whisper, RealtimeSTT, and other voice pipelines. No integration example exists for Cartesia's streaming STT. Our pipeline would benefit from VAD pre-filtering to eliminate noise transcripts at source.",
    background: [
      "We currently rely on word_count < 8 and duration < 1.0s heuristics to reject noise (see CSP-002). A proper VAD pre-filter would catch noise before it reaches the STT API, saving latency and credits.",
      "Silero VAD examples are all synchronous. Our entire voice pipeline is async (FastAPI + AsyncCartesia). Wiring VAD into an async pipeline requires undocumented patterns.",
      "The combination of VAD (pre-filter noise) + Ink word timestamps (post-filter low-quality transcripts) would give us two layers of quality gating.",
    ],
    proposal: "Build a Cartesia Ink + Silero VAD integration example showing async VAD pre-filtering before STT. Submit as a docs contribution to snakers4/silero-vad or as a standalone cookbook.",
    implementation: [
      "Prototype async VAD wrapper around Silero's ONNX model",
      "Integrate into our voice pipeline as a pre-filter before transcribe()",
      "Measure impact on false-negative rate and STT credit usage",
      "Package as a standalone example with clear async patterns",
    ],
    evidence: {
      ourFiles: ["routes/voice.py → word_count < 8 guard, duration < 1.0s guard"],
      linesOfCode: "N/A — new code to write",
      liveDemo: "https://math-olympiad.connectaiml.com",
    },
    nextSteps: [
      "Complete CSP-001 and CSP-002 first (establish Cartesia relationship)",
      "Prototype VAD integration locally",
      "Decide contribution target: silero-vad docs or standalone repo",
    ],
    risks: "Lower priority — CSP-002 improvements may reduce the need. Evaluate after production data.",
  },
  {
    id: "CSP-006",
    title: "Multi-voice persona support in LiveKit Cartesia plugin",
    target: { name: "LiveKit Agents", repo: "livekit/agents" },
    status: STATUS.CANDIDATE,
    priority: "P2",
    lastUpdated: "2026-03-24",
    authors: ["martinhewing"],
    overview: "LiveKit Agents has a Cartesia TTS plugin but it supports only one voice per agent instance. Our architecture switches between two Cartesia voices (tutor + examiner) based on FSM state. This multi-persona pattern is common in educational, customer service, and roleplay applications.",
    background: [
      "Our FSM orchestrator routes between Alex (tutor, Cartesia voice 1) and Jordan (examiner, Cartesia voice 2) based on session state, concept coverage, and candidate requests.",
      "Voice switching is currently manual: if/else on voice_id in the route handler, importing settings at call time.",
      "LiveKit's agent framework has the primitives for multi-agent sessions but no example combining stateful handover with voice switching.",
    ],
    proposal: "Extend the LiveKit Cartesia TTS plugin to support voice_id switching mid-conversation. Contribute a multi-agent example using our FSM + dual-voice architecture as the template.",
    implementation: [
      "Review LiveKit Agents plugin architecture and Cartesia TTS plugin source",
      "Prototype voice switching in the plugin's generate method",
      "Build example: two agents, shared state, voice-aware handover",
      "Submit plugin enhancement PR + example PR",
    ],
    evidence: {
      ourFiles: ["routes/voice.py → voice_id switching", "domain/fsm/ → state machine", "domain/agents/ → Alex + Jordan"],
      linesOfCode: "~200 lines of multi-agent orchestration to inform the example",
      liveDemo: "https://math-olympiad.connectaiml.com",
    },
    nextSteps: [
      "Complete CSP-001 through CSP-004 first (build Cartesia contribution track record)",
      "Study LiveKit plugin architecture",
      "Prototype locally before opening discussion",
    ],
    risks: "Larger organisation with established processes — may have internal plans for this. Open a discussion issue first.",
  },
];

// ── Priority colours ──────────────────────────────────────────────────────────
const priorityStyle = {
  P0: { color: "#ff4444", border: "rgba(255,68,68,0.3)" },
  P1: { color: "#ffcc00", border: "rgba(255,204,0,0.3)" },
  P2: { color: "#64b4ff", border: "rgba(100,180,255,0.3)" },
};

export default function OSSTargets() {
  const [expanded, setExpanded] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");

  const statuses = ["All", ...Object.values(STATUS).map(s => s.label)];
  const filtered = statusFilter === "All"
    ? proposals
    : proposals.filter(p => p.status.label === statusFilter);

  return (
    <div style={{
      fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace",
      background: "#09090b",
      color: "#e0e0e0",
      minHeight: "100vh",
      padding: "40px 24px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 880, margin: "0 auto" }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 40, borderBottom: "1px solid #1e1e1e", paddingBottom: 32 }}>
          <div style={{
            fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase",
            color: "#555", marginBottom: 8,
          }}>
            ConnectionSphere · Open Source Programme
          </div>
          <h1 style={{
            fontSize: 26, fontWeight: 700, color: "#fff", margin: "0 0 12px 0",
            fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.2,
          }}>
            Contribution Design Documents
          </h1>
          <p style={{
            fontSize: 13, color: "#888", lineHeight: 1.7, maxWidth: 700, margin: 0,
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            Each proposal below is grounded in production code from our voice AI pipeline
            — a mathematical olympiad tutor built on Cartesia Sonic/Ink, Claude, and FastAPI.
            Contributions are scoped to gaps we encountered as daily users, with working
            implementations already in our codebase.
          </p>

          {/* Project links */}
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { label: "Live Demo", href: "https://math-olympiad.connectaiml.com" },
              { label: "Source", href: "https://github.com/martinhewing/connectionsphere-factory" },
              { label: "GitHub", href: "https://github.com/martinhewing" },
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                style={{
                  fontSize: 10, color: "#64b4ff", textDecoration: "none",
                  padding: "4px 10px", borderRadius: 3,
                  border: "1px solid rgba(100,180,255,0.2)",
                  background: "rgba(100,180,255,0.04)",
                  letterSpacing: "0.04em",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(100,180,255,0.1)"; e.currentTarget.style.borderColor = "rgba(100,180,255,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(100,180,255,0.04)"; e.currentTarget.style.borderColor = "rgba(100,180,255,0.2)"; }}
              >
                {l.label} ↗
              </a>
            ))}
          </div>
        </div>

        {/* ── Status summary bar ──────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
          {Object.values(STATUS).map(s => {
            const count = proposals.filter(p => p.status.label === s.label).length;
            if (count === 0) return null;
            return (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: s.color, boxShadow: `0 0 6px ${s.color}40`,
                }} />
                <span style={{ fontSize: 11, color: "#777" }}>{count} {s.label}</span>
              </div>
            );
          })}
        </div>

        {/* ── Status filter ───────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap" }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              fontSize: 10, letterSpacing: "0.06em", padding: "5px 10px",
              borderRadius: 3, cursor: "pointer", transition: "all 0.15s",
              border: `1px solid ${statusFilter === s ? "#64b4ff" : "#222"}`,
              background: statusFilter === s ? "rgba(100,180,255,0.1)" : "#111",
              color: statusFilter === s ? "#64b4ff" : "#666",
            }}>
              {s}
            </button>
          ))}
        </div>

        {/* ── Proposal cards ──────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map((p, i) => {
            const isOpen = expanded === p.id;
            const ps = priorityStyle[p.priority];
            return (
              <div key={p.id} onClick={() => setExpanded(isOpen ? null : p.id)}
                style={{
                  background: isOpen ? p.status.bg : "#0f0f11",
                  border: `1px solid ${isOpen ? p.status.color + "30" : "#1a1a1a"}`,
                  borderRadius: 6, padding: "14px 20px", cursor: "pointer",
                  transition: "all 0.2s",
                }}>

                {/* ── Card header ─────────────────────────────────────── */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {/* Status dot */}
                  <div style={{
                    width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                    background: p.status.color, boxShadow: `0 0 8px ${p.status.color}40`,
                  }} />

                  {/* ID */}
                  <span style={{ fontSize: 10, color: "#555", fontWeight: 600, minWidth: 56 }}>
                    {p.id}
                  </span>

                  {/* Title */}
                  <span style={{
                    fontSize: 13, fontWeight: 600, color: "#eee",
                    fontFamily: "'IBM Plex Sans', sans-serif", flex: 1, minWidth: 200,
                  }}>
                    {p.title}
                  </span>

                  {/* Badges */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    <span style={{
                      fontSize: 9, padding: "2px 7px", borderRadius: 3,
                      background: p.status.bg, border: `1px solid ${p.status.color}30`,
                      color: p.status.color, letterSpacing: "0.08em", fontWeight: 500,
                    }}>
                      {p.status.label}
                    </span>
                    <span style={{
                      fontSize: 9, padding: "2px 7px", borderRadius: 3,
                      background: "rgba(0,0,0,0.3)", border: `1px solid ${ps.border}`,
                      color: ps.color, fontWeight: 600,
                    }}>
                      {p.priority}
                    </span>
                  </div>
                </div>

                {/* ── Target repo (always visible) ────────────────────── */}
                <div style={{ marginTop: 6, marginLeft: 17, display: "flex", alignItems: "center", gap: 8 }}>
                  <a href={`https://github.com/${p.target.repo}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      fontSize: 10, color: "#64b4ff", textDecoration: "none",
                      borderBottom: "1px solid transparent", transition: "border-color 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderBottomColor = "#64b4ff"}
                    onMouseLeave={e => e.currentTarget.style.borderBottomColor = "transparent"}
                  >
                    {p.target.repo} ↗
                  </a>
                  <span style={{ fontSize: 10, color: "#333" }}>·</span>
                  <span style={{ fontSize: 10, color: "#444" }}>{p.lastUpdated}</span>
                </div>

                {/* ── Expanded content ─────────────────────────────────── */}
                {isOpen && (
                  <div style={{
                    marginTop: 20, paddingTop: 20,
                    borderTop: `1px solid ${p.status.color}20`,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}>
                    {/* Overview */}
                    <Section label="Overview">
                      <p style={{ fontSize: 12.5, color: "#ccc", lineHeight: 1.7, margin: 0 }}>
                        {p.overview}
                      </p>
                    </Section>

                    {/* Background & Motivation */}
                    <Section label="Background & Motivation">
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {p.background.map((b, bi) => (
                          <div key={bi} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <span style={{ fontSize: 10, color: "#444", marginTop: 4, flexShrink: 0 }}>{bi + 1}.</span>
                            <span style={{ fontSize: 12, color: "#aaa", lineHeight: 1.65 }}>{b}</span>
                          </div>
                        ))}
                      </div>
                    </Section>

                    {/* Proposed Contribution */}
                    <Section label="Proposed Contribution">
                      <p style={{ fontSize: 12.5, color: "#ccc", lineHeight: 1.7, margin: 0 }}>
                        {p.proposal}
                      </p>
                    </Section>

                    {/* Implementation */}
                    <Section label={p.status === STATUS.SHIPPED ? "What We Shipped" : "Implementation Plan"}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {p.implementation.map((step, si) => (
                          <div key={si} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <div style={{
                              width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                              marginTop: 6,
                              background: p.status === STATUS.SHIPPED ? "#00ff88" : "#333",
                              boxShadow: p.status === STATUS.SHIPPED ? "0 0 4px rgba(0,255,136,0.3)" : "none",
                            }} />
                            <span style={{
                              fontSize: 12, lineHeight: 1.6,
                              color: p.status === STATUS.SHIPPED ? "#aaa" : "#999",
                              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                            }}>
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Section>

                    {/* Evidence */}
                    <Section label="Evidence from Our Codebase">
                      <div style={{
                        padding: "12px 14px", background: "rgba(0,0,0,0.3)",
                        borderRadius: 4, border: "1px solid #1a1a1a",
                        display: "grid", gap: 8,
                      }}>
                        <div>
                          <span style={{ fontSize: 9, color: "#555", letterSpacing: "0.1em" }}>FILES </span>
                          <span style={{ fontSize: 11, color: "#888", fontFamily: "'IBM Plex Mono', monospace" }}>
                            {p.evidence.ourFiles.join(" · ")}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: 9, color: "#555", letterSpacing: "0.1em" }}>SCOPE </span>
                          <span style={{ fontSize: 11, color: "#888" }}>{p.evidence.linesOfCode}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: 9, color: "#555", letterSpacing: "0.1em" }}>DEMO </span>
                          <a href={p.evidence.liveDemo} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: 11, color: "#64b4ff", textDecoration: "none" }}>
                            {p.evidence.liveDemo.replace("https://", "")} ↗
                          </a>
                        </div>
                      </div>
                    </Section>

                    {/* Next Steps */}
                    <Section label="Next Steps">
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {p.nextSteps.map((ns, ni) => (
                          <div key={ni} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <span style={{ fontSize: 10, color: "#444", marginTop: 2, flexShrink: 0 }}>→</span>
                            <span style={{ fontSize: 12, color: "#999", lineHeight: 1.6 }}>{ns}</span>
                          </div>
                        ))}
                      </div>
                    </Section>

                    {/* Risks */}
                    <Section label="Risks & Mitigations">
                      <p style={{ fontSize: 12, color: "#888", lineHeight: 1.65, margin: 0, fontStyle: "italic" }}>
                        {p.risks}
                      </p>
                    </Section>

                    {/* Links */}
                    <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                      {[
                        { label: "Repo", path: "" },
                        { label: "Issues", path: "/issues" },
                        { label: "PRs", path: "/pulls" },
                      ].map(link => (
                        <a key={link.label}
                          href={`https://github.com/${p.target.repo}${link.path}`}
                          target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{
                            fontSize: 10, color: "#64b4ff", textDecoration: "none",
                            padding: "3px 10px", borderRadius: 3,
                            border: "1px solid rgba(100,180,255,0.2)",
                            background: "rgba(100,180,255,0.04)",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(100,180,255,0.12)"; e.currentTarget.style.borderColor = "rgba(100,180,255,0.4)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(100,180,255,0.04)"; e.currentTarget.style.borderColor = "rgba(100,180,255,0.2)"; }}
                        >
                          {link.label} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div style={{
          marginTop: 40, paddingTop: 24, borderTop: "1px solid #1a1a1a",
          fontSize: 11, color: "#444", lineHeight: 1.7,
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}>
          <strong style={{ color: "#666" }}>Methodology.</strong> Proposals follow a fix-first-then-upstream pattern:
          identify friction in production use → build a local workaround → adopt any existing SDK
          features we missed → file an issue or PR for the remaining gap with working code as evidence.
          Each proposal references specific files, line counts, and a live demo.
        </div>
      </div>
    </div>
  );
}

// ── Section component ─────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 9, color: "#555", letterSpacing: "0.18em",
        textTransform: "uppercase", marginBottom: 8, fontWeight: 600,
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}
