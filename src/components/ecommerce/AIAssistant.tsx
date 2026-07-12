'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  '¿Qué productos destacados tienen?',
  '¿Cómo pago con Zelle?',
  '¿Cuánto tarda el envío?',
  'Recomiéndame un regalo',
];

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    '¡Hola! 👋 Soy Diaz IA, tu asistente de compras. Puedo ayudarte a encontrar productos, resolver dudas sobre envíos y pagos con Zelle. ¿En qué puedo ayudarte hoy?',
};

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  async function send(messageText: string) {
    const text = messageText.trim();
    if (!text || loading) return;

    setError(null);
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: newMessages.slice(-7, -1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || 'Error desconocido');
      }
      setMessages((cur) => [...cur, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de conexión';
      setError(msg);
      setMessages((cur) => [
        ...cur,
        {
          role: 'assistant',
          content:
            'Disculpa, tuve un problema técnico. Intenta nuevamente en unos segundos. 🙏',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        type="button"
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente IA'}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30 transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
        )}
      </button>

      {/* Panel del chat */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[520px] max-h-[calc(100vh-7rem)] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold leading-tight">Diaz IA</p>
              <p className="text-[11px] text-amber-100 leading-tight truncate">
                Powered by GLM-5.2 · Asistente de compras
              </p>
            </div>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mensajes */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto bg-gray-50 px-3 py-4 space-y-3"
          >
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} content={m.content} />
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 pl-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Diaz IA está escribiendo…
              </div>
            )}
            {error && (
              <p className="text-[11px] text-red-500 px-2">{error}</p>
            )}
          </div>

          {/* Sugerencias */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-gray-100 bg-white px-3 py-2.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  disabled={loading}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-gray-200 bg-white p-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje…"
              maxLength={1000}
              disabled={loading}
              className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Enviar"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'rounded-br-sm bg-gradient-to-br from-amber-500 to-orange-500 text-white'
            : 'rounded-bl-sm bg-white text-gray-800 border border-gray-100'
        }`}
      >
        {content}
      </div>
    </div>
  );
}
