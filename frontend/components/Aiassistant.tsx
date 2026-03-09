"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sparkles, X, Send, RotateCcw, ChevronDown, User, Minimize2, Maximize2,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ── Types ────────────────────────────────────────────────────────
type Message = {
  role: "user" | "assistant";
  content: string;
  id: string;
};

// ── Suggested questions ──────────────────────────────────────────
const SUGGESTIONS = [
  "How do I create a new form?",
  "How do I add conditional logic?",
  "How do I change the form theme?",
  "How do I share my form?",
  "What block types are available?",
  "How do I use AI to generate a form?",
  "How do I view responses?",
  "How do I password-protect a form?",
];

// ── Markdown-ish renderer ─────────────────────────────────────────
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];
  let i = 0;

  const renderInline = (str: string) => {
    const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((p, j) => {
      if (p.startsWith("**") && p.endsWith("**"))
        return <strong key={j} className="font-semibold text-gray-900">{p.slice(2, -2)}</strong>;
      if (p.startsWith("`") && p.endsWith("`"))
        return <code key={j} className="bg-gray-100 text-blue-700 px-1 py-0.5 rounded text-[11px] font-mono">{p.slice(1, -1)}</code>;
      return <span key={j}>{p}</span>;
    });
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    // Bullet list
    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("• "))) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="space-y-1 my-2">
          {items.map((it, j) => (
            <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
              <span>{renderInline(it)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\./.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\./.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s*/, ""));
        i++;
      }
      elements.push(
        <ol key={i} className="space-y-1 my-2">
          {items.map((it, j) => (
            <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{j + 1}</span>
              <span>{renderInline(it)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} className="text-sm text-gray-700 leading-relaxed my-1">{renderInline(line)}</p>
    );
    i++;
  }

  return elements;
}

// ── Typing indicator ─────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
        <Sparkles className="w-3 h-3 text-white" />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

// ── Message bubble ───────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex items-end gap-2 mb-3", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      )}
      {isUser && (
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
          <User className="w-3 h-3 text-gray-500" />
        </div>
      )}
      <div className={cn(
        "max-w-[82%] rounded-2xl px-4 py-2.5",
        isUser
          ? "bg-blue-600 text-white rounded-br-sm"
          : "bg-gray-100 rounded-bl-sm"
      )}>
        {isUser
          ? <p className="text-sm text-white leading-relaxed">{msg.content}</p>
          : <div>{renderMarkdown(msg.content)}</div>
        }
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm the Intake Assistant 👋\n\nI can help you with anything in Intake — creating forms, adding blocks, setting up logic, themes, sharing, and more.\n\nWhat would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Listen for open event dispatched by sidebar button
  useEffect(() => {
    const handler = () => { setOpen(true); setUnread(0); };
    window.addEventListener("intake:open-assistant", handler);
    return () => window.removeEventListener("intake:open-assistant", handler);
  }, []);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: trimmed };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    try {
      const response = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = data.reply || "Sorry, I couldn't get a response. Please try again.";
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: reply };
      setMessages((prev) => [...prev, assistantMsg]);
      if (!open) setUnread((n) => n + 1);
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "Something went wrong. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, open]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const reset = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm the Intake Assistant 👋\n\nI can help you with anything in Intake — creating forms, adding blocks, setting up logic, themes, sharing, and more.\n\nWhat would you like to know?",
    }]);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(!open); setUnread(0); }}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-13 h-13 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
          "bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
          open && "rotate-0 scale-95"
        )}
        style={{ width: 52, height: 52 }}
        aria-label="Open AI Assistant"
      >
        {open
          ? <X className="w-5 h-5 text-white" />
          : <Sparkles className="w-5 h-5 text-white" />
        }
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className={cn(
          "fixed right-6 z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200",
          minimised ? "bottom-[72px] w-80 h-14" : "bottom-[72px] w-[380px]",
        )}
          style={{ height: minimised ? 56 : 560 }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700 shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Intake Assistant</p>
              <p className="text-[11px] text-blue-200">Ask me anything about Intake</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={reset}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
                title="New conversation">
                <RotateCcw className="w-3.5 h-3.5 text-white" />
              </button>
              <button onClick={() => setMinimised(!minimised)}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors">
                {minimised ? <Maximize2 className="w-3.5 h-3.5 text-white" /> : <Minimize2 className="w-3.5 h-3.5 text-white" />}
              </button>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {!minimised && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scroll-smooth">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                {loading && <TypingIndicator />}
                <div ref={bottomRef} />
              </div>

              {/* Suggestions (only show when only welcome message) */}
              {messages.length === 1 && (
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {SUGGESTIONS.slice(0, 4).map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s)}
                      className="text-[11px] text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-full px-2.5 py-1 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-4 pb-4 shrink-0">
                <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:border-blue-400 focus-within:bg-white transition-colors">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about Intake…"
                    disabled={loading}
                    className="flex-1 bg-transparent text-sm outline-none resize-none text-gray-800 placeholder:text-gray-400 min-h-[24px] max-h-[100px] leading-relaxed"
                    style={{ height: 24 }}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                      input.trim() && !loading
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-2">Shift+Enter for new line · Enter to send</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}