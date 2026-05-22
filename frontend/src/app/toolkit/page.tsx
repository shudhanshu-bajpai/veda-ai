"use client";

import { useState, useRef, useEffect } from "react";
import Header from "@/components/layout/Header";
import {
  Send,
  Sparkles,
  User,
  Bot,
  Trash2,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Lightbulb,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  {
    icon: BookOpen,
    label: "Lesson Plan",
    prompt: "Help me create a lesson plan for teaching photosynthesis to 8th graders",
  },
  {
    icon: ClipboardList,
    label: "Quiz Ideas",
    prompt: "Suggest 5 creative quiz formats for assessing reading comprehension",
  },
  {
    icon: GraduationCap,
    label: "Teaching Strategy",
    prompt: "What are effective strategies for teaching math to visual learners?",
  },
  {
    icon: Lightbulb,
    label: "Activity Ideas",
    prompt: "Suggest engaging classroom activities for teaching the water cycle",
  },
];

function formatMessage(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <p key={i} className="font-semibold mt-2 mb-1">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <li key={i} className="ml-4 list-disc">
          {line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}
        </li>
      );
    }
    if (line.match(/^\d+\.\s/)) {
      return (
        <li key={i} className="ml-4 list-decimal">
          {line.replace(/^\d+\.\s/, "").replace(/\*\*(.*?)\*\*/g, "$1")}
        </li>
      );
    }
    if (line.trim() === "") {
      return <br key={i} />;
    }
    return (
      <p key={i}>
        {line.replace(/\*\*(.*?)\*\*/g, "$1")}
      </p>
    );
  });
}

export default function ToolkitPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Chat request failed");
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to get response"
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Chat cleared");
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="AI Teacher's Toolkit" showBack />

      <div className="flex-1 flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-600 rounded-2xl flex items-center justify-center mb-5">
              <Sparkles size={28} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              AI Teacher&apos;s Toolkit
            </h2>
            <p className="text-sm text-gray-500 text-center max-w-md mb-8">
              Your AI-powered teaching assistant. Ask me anything about lesson
              planning, assessments, teaching strategies, or subject-specific
              help.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {QUICK_PROMPTS.map((qp) => {
                const Icon = qp.icon;
                return (
                  <button
                    key={qp.label}
                    onClick={() => sendMessage(qp.prompt)}
                    className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors">
                      <Icon size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {qp.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {qp.prompt}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={16} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gray-900 text-white rounded-br-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="space-y-1">{formatMessage(msg.content)}</div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 size={14} className="animate-spin" />
                      Thinking...
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white px-4 lg:px-8 py-3">
          <div className="max-w-3xl mx-auto">
            {messages.length > 0 && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={clearChat}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={12} />
                  Clear chat
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about teaching..."
                  rows={1}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 resize-none transition-all"
                  style={{
                    minHeight: "44px",
                    maxHeight: "120px",
                    height: "auto",
                    overflow: "auto",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height =
                      Math.min(target.scrollHeight, 120) + "px";
                  }}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="w-11 h-11 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              VedaAI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
