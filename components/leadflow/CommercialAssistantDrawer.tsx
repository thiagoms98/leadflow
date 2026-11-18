'use client';

import { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  X,
  Send,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Loader2,
  Building2,
} from 'lucide-react';
import { formatBRL, type Lead, type LeadActivity } from '@/lib/leadflow-data';
import { cn } from '@/lib/utils';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface CommercialAssistantDrawerProps {
  open: boolean;
  onClose: () => void;
  leads: Lead[];
  activities: LeadActivity[];
  focusedLead: Lead | null;
  onClearFocusedLead: () => void;
  userName: string;
}

const GENERAL_PROMPTS = [
  'Quais leads devo priorizar hoje para fechar mais rápido?',
  'Analise os gargalos do meu funil comercial atual',
  'Monte um plano de follow-ups para as próximas 48 horas',
  'Calcule minha previsão realista de fechamento neste mês',
];

const FOCUSED_LEAD_PROMPTS = [
  'Redija uma mensagem de WhatsApp objetiva para avançar este negócio',
  'Escreva um e-mail de follow-up consultivo personalizado',
  'Quais objeções podem surgir e como contorná-las?',
  'Sugira as 3 melhores perguntas para a próxima reunião',
];

let messageSeq = 0;
function createMessageId(prefix: string): string {
  messageSeq += 1;
  return `${prefix}-${messageSeq}`;
}

export function CommercialAssistantDrawer({
  open,
  onClose,
  leads,
  activities,
  focusedLead,
  onClearFocusedLead,
  userName,
}: CommercialAssistantDrawerProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  if (!open) return null;

  const quickPrompts = focusedLead ? FOCUSED_LEAD_PROMPTS : GENERAL_PROMPTS;

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback silencioso
    }
  };

  const sendMessage = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || streaming) return;

    setError('');
    const userMsg: AssistantMessage = {
      id: createMessageId('usr'),
      role: 'user',
      content: trimmed,
    };
    const assistantId = createMessageId('ast');
    const nextHistory = [...messages, userMsg];

    setMessages([
      ...nextHistory,
      { id: assistantId, role: 'assistant', content: '' },
    ]);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          leads,
          activities,
          focusedLead,
          userName,
        }),
      });

      if (!res.ok || !res.body) {
        const errPayload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errPayload.error || 'Não foi possível obter resposta do assistente.'
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedText = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const chunk of parts) {
          const line = chunk.trim();
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload) as {
              text?: string;
              error?: string;
            };
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            const delta = parsed.text;
            if (delta) {
              receivedText = true;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + delta }
                    : m
                )
              );
            }
          } catch (e) {
            if (e instanceof Error && e.message) {
              throw e;
            }
          }
        }
      }

      if (!receivedText) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setError('O assistente não retornou conteúdo para esta solicitação.');
      }
    } catch (err) {
      setMessages((prev) =>
        prev.filter((m) => !(m.id === assistantId && !m.content))
      );
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao consultar o assistente comercial.'
      );
    } finally {
      setStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-[#050811]/70 backdrop-blur-sm cursor-pointer"
      />

      {/* Drawer Elevado do Assistente Comercial */}
      <aside
        aria-label="Assistente Comercial IA"
        className="glass-panel-elevated relative z-10 flex h-full w-full max-w-xl flex-col border-l border-[#7dd3fc]/20 border-y-0 border-r-0"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3 border-b border-[#7dd3fc]/12 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#c8a0f0]/35 bg-[#c8a0f0]/15 text-[#c8a0f0]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-display text-base font-semibold text-slate-50">
                Assistente Comercial
              </h2>
              <p className="truncate text-xs text-slate-400">
                Estratégia de funil, follow-ups e roteiros personalizados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setError('');
                }}
                title="Nova conversa"
                aria-label="Reiniciar conversa"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:border-[#7dd3fc]/35 hover:text-[#7dd3fc] transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar assistente"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:border-[#7dd3fc]/35 hover:text-slate-50 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contexto de Lead em Foco (quando aberto pela ficha de um lead) */}
        {focusedLead && (
          <div className="flex items-center justify-between gap-3 border-b border-[#7dd3fc]/10 bg-[#7dd3fc]/[0.06] px-5 py-2.5 sm:px-6 text-xs">
            <div className="flex items-center gap-2 min-w-0 text-slate-200">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-[#7dd3fc]" />
              <span className="truncate">
                Contexto:{' '}
                <strong className="font-semibold text-slate-50">
                  {focusedLead.company}
                </strong>{' '}
                · {focusedLead.name} ·{' '}
                <span className="font-mono text-[#7dd3fc] tabular-nums">
                  {formatBRL(focusedLead.value)}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={onClearFocusedLead}
              aria-label="Remover foco do lead"
              className="shrink-0 text-slate-400 hover:text-slate-100 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Área de Conversa */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {messages.length === 0 ? (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <p className="font-display text-lg font-semibold text-slate-50 text-balance">
                  Como posso acelerar suas vendas hoje, {userName.split(' ')[0]}?
                </p>
                <p className="text-sm leading-relaxed text-slate-400">
                  Estou conectado em tempo real aos seus{' '}
                  <span className="font-mono text-slate-200 tabular-nums">
                    {leads.length}
                  </span>{' '}
                  leads e{' '}
                  <span className="font-mono text-slate-200 tabular-nums">
                    {activities.filter((a) => !a.completed).length}
                  </span>{' '}
                  follow-ups pendentes. Escolha uma sugestão ou pergunte
                  livremente:
                </p>
              </div>

              <div className="space-y-2.5">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="glass-card-interactive flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-xs sm:text-sm text-slate-200 hover:text-[#7dd3fc] cursor-pointer"
                  >
                    <span>{prompt}</span>
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#c8a0f0]" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex flex-col gap-1.5',
                      isUser ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                        isUser
                          ? 'border border-[#7dd3fc]/30 bg-[#7dd3fc]/14 text-slate-50'
                          : 'glass-panel text-slate-100'
                      )}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : msg.content ? (
                        <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:text-[#7dd3fc] prose-headings:font-display prose-headings:text-slate-50">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7dd3fc]" />
                          <span>Analisando pipeline...</span>
                        </span>
                      )}
                    </div>

                    {!isUser && msg.content && !streaming && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-slate-400 hover:text-[#7dd3fc] transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-300" />
                            <span className="text-emerald-300">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar resposta</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
              <div ref={scrollEndRef} />
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-400/30 bg-rose-500/12 px-4 py-3 text-xs font-medium text-rose-200"
            >
              {error}
            </div>
          )}
        </div>

        {/* Atalhos quando já há conversa + Campo de Entrada */}
        <div className="border-t border-[#7dd3fc]/12 p-4 sm:p-5 space-y-3">
          {messages.length > 0 && !streaming && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {quickPrompts.slice(0, 3).map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="glass-btn-secondary rounded-xl px-3 py-1.5 text-[11px] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2.5">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Pergunte sobre negociações, peça um e-mail ou estratégia..."
              disabled={streaming}
              className="glass-input flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              aria-label="Enviar mensagem para o assistente"
              className="glass-btn-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-40 cursor-pointer"
            >
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
