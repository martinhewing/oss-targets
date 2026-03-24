import { useState } from "react";

const projects = [
  {
    name: "Cartesia Python SDK",
    repo: "cartesia-ai/cartesia-python",
    zone: "Voice AI",
    stars: "~200",
    difficulty: "Low–Med",
    tier: 1,
    friction: [
      {
        what: "No text preprocessing hook before TTS",
        ourWorkaround: "We built _strip_latex() and _latex_to_speech() — 40+ lines of regex to convert LaTeX to speakable text. Every educational TTS app needs this.",
        contribution: "Add a text_preprocessor callback to the TTS client, or ship a contrib module with common normalisers (LaTeX, Markdown, code, URLs).",
        file: "voice/tts.py, routes/voice.py",
      },
      {
        what: "No built-in stream-and-save pattern",
        ourWorkaround: "We wrote _audio_and_save() — an async generator that yields chunks to the client AND accumulates them for disk save. Common need, everyone reimplements it.",
        contribution: "Add a tee_stream() utility or a save_path param to the streaming API that handles dual-write natively.",
        file: "routes/voice.py → _audio_and_save()",
      },
      {
        what: "No voice persona abstraction",
        ourWorkaround: "Manual voice_id switching with if/else — checking ALEX_VOICE vs default, importing settings inside the handler. Two agents, two voices, zero SDK support.",
        contribution: "Add a Voice or Persona class that wraps voice_id + model + output_format. SDK currently makes you pass raw dicts everywhere.",
        file: "routes/voice.py → use_voice logic",
      },
      {
        what: "STT returns bare transcript string — no confidence, no word timestamps",
        ourWorkaround: "We guard on word count (< 8 words = mic noise) and byte length (< 1000 = too short). Pure heuristics because the SDK gives us nothing to work with.",
        contribution: "Expose confidence scores and word-level timestamps from ink-whisper. The model produces them — the SDK just doesn't surface them.",
        file: "routes/voice.py → submit_voice_answer()",
      },
    ],
  },
  {
    name: "RealtimeSTT",
    repo: "KoljaB/RealtimeSTT",
    zone: "Voice AI",
    stars: "~3.5k",
    difficulty: "Medium",
    tier: 1,
    friction: [
      {
        what: "No Cartesia Ink (SSM-based) engine — only Whisper, Deepgram, Azure",
        ourWorkaround: "We use Cartesia Ink directly via their SDK. But RealtimeSTT's engine abstraction is clean and we know Ink's API intimately.",
        contribution: "Implement CartesiaEngine class following the existing engine interface. Our stt.py transcribe() function is the reference implementation.",
        file: "voice/stt.py",
      },
      {
        what: "No semantic turn-boundary detection",
        ourWorkaround: "We describe 'semantic turn boundaries' as a differentiator in our README but actually use word-count thresholds. A proper VAD + linguistic endpoint detector is missing from the ecosystem.",
        contribution: "Add a turn-boundary callback that combines Silero VAD with transcript-level heuristics (sentence completion, trailing silence after a complete thought).",
        file: "routes/voice.py → 8-word threshold",
      },
    ],
  },
  {
    name: "RealtimeTTS",
    repo: "KoljaB/RealtimeTTS",
    zone: "Voice AI",
    stars: "~2k",
    difficulty: "Medium",
    tier: 1,
    friction: [
      {
        what: "No Cartesia Sonic engine — only Coqui, ElevenLabs, Azure, System",
        ourWorkaround: "We built stream_tts() and generate_tts() from scratch against Cartesia's WebSocket API. The streaming chunk protocol, output format config, voice dict — all manual.",
        contribution: "Implement CartesiaEngine. Our tts.py is the blueprint — stream mode via WebSocket, generate mode by accumulating chunks. Same maintainer as RealtimeSTT.",
        file: "voice/tts.py",
      },
      {
        what: "No text preprocessing pipeline before speech",
        ourWorkaround: "Our _strip_latex() runs before every TTS call. RealtimeTTS has no hook for this — if you feed it LaTeX or Markdown, it reads the markup characters aloud.",
        contribution: "Add a preprocessor chain to the base engine class. Text goes through normalisers before hitting any TTS provider.",
        file: "routes/voice.py → _strip_latex()",
      },
    ],
  },
  {
    name: "Silero VAD",
    repo: "snakers4/silero-vad",
    zone: "ML / Audio",
    stars: "~5k",
    difficulty: "Low–Med",
    tier: 2,
    friction: [
      {
        what: "No integration examples for Cartesia's streaming STT",
        ourWorkaround: "We don't use VAD at all — we rely on byte-length and word-count heuristics to detect noise vs speech. A proper VAD pre-filter would eliminate the 'mic cut off' nudge messages.",
        contribution: "Add a Cartesia + Silero VAD integration example. Show how to pre-filter audio chunks through VAD before sending to Ink, eliminating noise transcripts at the source.",
        file: "routes/voice.py → len(audio_bytes) < 1000 guard",
      },
      {
        what: "Python async API is underdocumented",
        ourWorkaround: "Our entire voice pipeline is async (FastAPI + AsyncCartesia). Silero VAD examples are all synchronous. Wiring them into an async pipeline requires guesswork.",
        contribution: "Add async examples and document thread-safety for use inside async frameworks like FastAPI.",
        file: "voice/ (async throughout)",
      },
    ],
  },
  {
    name: "Kokoro",
    repo: "hexgrad/kokoro",
    zone: "ML / TTS",
    stars: "~8k",
    difficulty: "Medium",
    tier: 2,
    friction: [
      {
        what: "No FastAPI integration example — docs assume CLI or notebook usage",
        ourWorkaround: "N/A — we use Cartesia. But if we ever need local TTS fallback (offline, cost, latency), Kokoro is the leading candidate. The gap is real: no streaming API, no async, no web framework examples.",
        contribution: "Add a FastAPI streaming endpoint example. Show how to serve Kokoro TTS behind the same StreamingResponse pattern we use with Cartesia.",
        file: "Informed by our voice/tts.py streaming pattern",
      },
      {
        what: "No voice-switching API for multi-persona apps",
        ourWorkaround: "Our dual-agent system (Alex + Jordan) switches Cartesia voices per agent. Kokoro has voice packs but no clean API for switching mid-session.",
        contribution: "Document and improve the voice-switching API for applications that need multiple personas in a single session.",
        file: "Informed by our agent voice architecture",
      },
    ],
  },
  {
    name: "faster-whisper",
    repo: "SYSTRAN/faster-whisper",
    zone: "ML / STT",
    stars: "~13k",
    difficulty: "Medium",
    tier: 2,
    friction: [
      {
        what: "No confidence-based filtering for short/noisy audio",
        ourWorkaround: "Our 8-word and 1000-byte thresholds are crude. faster-whisper returns word-level confidence but the docs don't show how to use them for quality gating in a voice pipeline.",
        contribution: "Add a cookbook example: using word-level confidence and no_speech_prob to filter noise, with thresholds tuned for conversational voice apps (not podcasts or meetings).",
        file: "routes/voice.py → transcript quality guards",
      },
    ],
  },
  {
    name: "LiveKit Agents",
    repo: "livekit/agents",
    zone: "Voice AI Infra",
    stars: "~2.5k",
    difficulty: "Med–High",
    tier: 2,
    friction: [
      {
        what: "Cartesia plugin exists but lacks multi-voice / persona support",
        ourWorkaround: "Our FSM orchestrator switches between Alex and Jordan voices based on session state. LiveKit's Cartesia plugin has no equivalent — it's one voice per agent.",
        contribution: "Extend the Cartesia TTS plugin to support voice switching mid-conversation. Our FSM + dual-voice architecture is the use case.",
        file: "Informed by our multi-agent orchestration",
      },
      {
        what: "No example of stateful multi-agent voice sessions",
        ourWorkaround: "We built FSM + DLL + Redis concept accumulator from scratch. LiveKit Agents has the primitives but no example combining them into a stateful multi-agent flow.",
        contribution: "Add a multi-agent example: two agents with different voices, shared state, and handover logic. Our architecture is the template.",
        file: "Informed by our FSM + DLL + Redis design",
      },
    ],
  },
  {
    name: "Anthropic SDK (Python)",
    repo: "anthropics/anthropic-sdk-python",
    zone: "AI / Backend",
    stars: "~2k",
    difficulty: "Low",
    tier: 3,
    friction: [
      {
        what: "No example of Claude + TTS pipeline (text generation → speech)",
        ourWorkaround: "We pipe Claude's response through _strip_latex() then into Cartesia TTS. This Claude → preprocess → TTS pattern is common but undocumented in the SDK.",
        contribution: "Add a cookbook example showing Claude streaming → text preprocessing → TTS streaming. Our pipeline is the reference.",
        file: "engine/ + voice/ pipeline",
      },
    ],
  },
];

const tierColors = {
  1: { bg: "rgba(0, 255, 136, 0.06)", border: "rgba(0, 255, 136, 0.25)", badge: "#00ff88", label: "We hit this daily" },
  2: { bg: "rgba(100, 180, 255, 0.06)", border: "rgba(100, 180, 255, 0.25)", badge: "#64b4ff", label: "We'd use this if it existed" },
  3: { bg: "rgba(180, 180, 180, 0.06)", border: "rgba(180, 180, 180, 0.2)", badge: "#999", label: "Nice to have" },
};

const zones = ["All", "Voice AI", "ML / Audio", "ML / TTS", "ML / STT", "Voice AI Infra", "AI / Backend"];

export default function OSSTargets() {
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState(null);

  const filtered = filter === "All" ? projects : projects.filter(p => p.zone === filter);
  const totalFriction = filtered.reduce((sum, p) => sum + p.friction.length, 0);

  return (
    <div style={{
      fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace",
      background: "#0a0a0a",
      color: "#e0e0e0",
      minHeight: "100vh",
      padding: "32px 24px",
    }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "#666", marginBottom: 6
          }}>
            ConnectionSphere · OSS Contribution Targets
          </div>
          <h1 style={{
            fontSize: 22, fontWeight: 600, color: "#fff", margin: 0,
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            Contributions from User Experience
          </h1>
          <p style={{ fontSize: 12, color: "#777", marginTop: 8, lineHeight: 1.7, maxWidth: 680 }}>
            Every entry below maps to code we actually wrote, a workaround we built,
            or a gap we hit while building the Factory's voice pipeline.
            The contribution angle isn't "find a good-first-issue" —
            it's "we already solved this locally, now upstream it."
          </p>
          <div style={{
            fontSize: 11, color: "#555", marginTop: 12,
            padding: "8px 12px", background: "#111", borderRadius: 4,
            border: "1px solid #1e1e1e", display: "inline-block",
          }}>
            {totalFriction} friction points across {filtered.length} projects
          </div>
        </div>

        {/* Tier legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          {Object.entries(tierColors).map(([t, c]) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: c.badge, boxShadow: `0 0 6px ${c.badge}40`,
              }} />
              <span style={{ fontSize: 11, color: "#888" }}>Tier {t}: {c.label}</span>
            </div>
          ))}
        </div>

        {/* Zone filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {zones.map(z => (
            <button
              key={z}
              onClick={() => setFilter(z)}
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                padding: "5px 10px",
                borderRadius: 3,
                border: `1px solid ${filter === z ? "#64b4ff" : "#2a2a2a"}`,
                background: filter === z ? "rgba(100,180,255,0.1)" : "#141414",
                color: filter === z ? "#64b4ff" : "#888",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {z}
            </button>
          ))}
        </div>

        {/* Project cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((p, i) => {
            const tc = tierColors[p.tier];
            const isOpen = expanded === i;
            return (
              <div
                key={p.repo}
                onClick={() => setExpanded(isOpen ? null : i)}
                style={{
                  background: isOpen ? tc.bg : "#111",
                  border: `1px solid ${isOpen ? tc.border : "#1e1e1e"}`,
                  borderRadius: 6,
                  padding: "14px 18px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {/* Row header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: tc.badge, flexShrink: 0,
                    boxShadow: `0 0 8px ${tc.badge}50`,
                  }} />
                  <span style={{
                    fontSize: 13, fontWeight: 600, color: "#fff",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}>
                    {p.name}
                  </span>
                  <a
                    href={`https://github.com/${p.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: 10, color: "#64b4ff",
                      fontFamily: "'IBM Plex Mono', monospace",
                      textDecoration: "none",
                      borderBottom: "1px solid transparent",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderBottomColor = "#64b4ff"}
                    onMouseLeave={(e) => e.currentTarget.style.borderBottomColor = "transparent"}
                  >
                    {p.repo} ↗
                  </a>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{
                      fontSize: 9, padding: "2px 7px", borderRadius: 3,
                      background: "#1a1a1a", border: "1px solid #2a2a2a",
                      color: "#888", letterSpacing: "0.06em",
                    }}>
                      {p.zone}
                    </span>
                    <span style={{
                      fontSize: 9, padding: "2px 7px", borderRadius: 3,
                      background: "#1a1a1a", border: "1px solid #2a2a2a",
                      color: "#666",
                    }}>
                      {p.friction.length} friction {p.friction.length === 1 ? "point" : "points"}
                    </span>
                    <span style={{
                      fontSize: 9, padding: "2px 7px", borderRadius: 3,
                      background: `${tc.badge}15`, border: `1px solid ${tc.badge}30`,
                      color: tc.badge,
                    }}>
                      {p.difficulty}
                    </span>
                  </div>
                </div>

                {/* Expanded: friction points */}
                {isOpen && (
                  <div style={{
                    marginTop: 16, paddingTop: 14,
                    borderTop: `1px solid ${tc.border}`,
                    display: "flex", flexDirection: "column", gap: 20,
                  }}>
                    {p.friction.map((f, fi) => (
                      <div key={fi} style={{
                        padding: "14px 16px",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: 5,
                        borderLeft: `3px solid ${tc.badge}40`,
                      }}>
                        {/* Friction title */}
                        <div style={{
                          fontSize: 12, fontWeight: 600, color: "#ddd",
                          marginBottom: 12,
                          fontFamily: "'IBM Plex Sans', sans-serif",
                        }}>
                          {f.what}
                        </div>

                        {/* Our workaround */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{
                            fontSize: 9, color: "#f48fb1", letterSpacing: "0.12em",
                            textTransform: "uppercase", marginBottom: 4,
                          }}>
                            What we built instead
                          </div>
                          <div style={{ fontSize: 11, color: "#aaa", lineHeight: 1.65 }}>
                            {f.ourWorkaround}
                          </div>
                        </div>

                        {/* The contribution */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{
                            fontSize: 9, color: "#00ff88", letterSpacing: "0.12em",
                            textTransform: "uppercase", marginBottom: 4,
                          }}>
                            Contribution
                          </div>
                          <div style={{ fontSize: 11, color: "#ccc", lineHeight: 1.65 }}>
                            {f.contribution}
                          </div>
                        </div>

                        {/* Our file ref */}
                        <div style={{
                          fontSize: 10, color: "#555",
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}>
                          Our code: {f.file}
                        </div>
                      </div>
                    ))}

                    {/* Links row */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                      paddingTop: 8,
                    }}>
                      <span style={{ fontSize: 10, color: "#444" }}>★ {p.stars}</span>
                      <span style={{ color: "#333" }}>·</span>
                      {[
                        { label: "Repo", path: "" },
                        { label: "Issues", path: "/issues" },
                        { label: "PRs", path: "/pulls" },
                      ].map(link => (
                        <a
                          key={link.label}
                          href={`https://github.com/${p.repo}${link.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: 10, color: "#64b4ff", textDecoration: "none",
                            padding: "2px 8px", borderRadius: 3,
                            border: "1px solid rgba(100,180,255,0.2)",
                            background: "rgba(100,180,255,0.05)",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(100,180,255,0.12)";
                            e.currentTarget.style.borderColor = "rgba(100,180,255,0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(100,180,255,0.05)";
                            e.currentTarget.style.borderColor = "rgba(100,180,255,0.2)";
                          }}
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

        {/* Strategy note */}
        <div style={{
          marginTop: 32, padding: "18px 20px",
          background: "#0d0d0d", border: "1px solid #1a1a1a",
          borderRadius: 6,
        }}>
          <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
            The pattern
          </div>
          <div style={{ fontSize: 12, color: "#999", lineHeight: 1.7 }}>
            Every Tier 1 entry follows the same arc: we hit a gap in the SDK or library,
            built a workaround in our codebase, and now have working code that can be
            generalised into an upstream contribution. The Cartesia SDK is the highest-leverage
            target — four separate friction points, all from daily use, all with code we've
            already written. RealtimeSTT and RealtimeTTS are the second play: we've already
            implemented Cartesia's streaming protocols, and both projects have a clean engine
            interface waiting for a Cartesia implementation.
          </div>
        </div>
      </div>
    </div>
  );
}
