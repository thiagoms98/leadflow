'use client';

import { useState } from 'react';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Copy,
  Check,
  Edit3,
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
  CalendarClock,
  Sparkles,
} from 'lucide-react';
import {
  PIPELINE_STAGES,
  ACTIVITY_TYPES,
  formatBRL,
  formatDateBR,
  formatShortDateBR,
  getTeamMember,
  type ActivityType,
  type Lead,
  type LeadActivity,
  type PipelineStage,
} from '@/lib/leadflow-data';
import { TeamAvatar } from './TeamAvatar';
import { cn } from '@/lib/utils';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  activities: LeadActivity[];
  onClose: () => void;
  onMoveStage: (leadId: string, stage: PipelineStage) => void;
  onUpdateNotes: (leadId: string, notes: string) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onToggleActivity: (activityId: string) => void;
  onAddActivity: (activity: Omit<LeadActivity, 'id' | 'completed'>) => void;
  onAskAssistant?: (lead: Lead) => void;
}

function LeadDetailDrawerInner({
  lead,
  activities,
  onClose,
  onMoveStage,
  onUpdateNotes,
  onEditLead,
  onDeleteLead,
  onToggleActivity,
  onAddActivity,
  onAskAssistant,
}: Omit<LeadDetailDrawerProps, 'lead'> & { lead: Lead }) {
  const [notesDraft, setNotesDraft] = useState(lead.notes);
  const [notesSaved, setNotesSaved] = useState(false);
  const [copiedField, setCopiedField] = useState<'email' | 'phone' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [newActType, setNewActType] = useState<ActivityType>('Ligação');
  const [newActTitle, setNewActTitle] = useState('');
  const [newActDate, setNewActDate] = useState('2026-11-19');

  const owner = getTeamMember(lead.ownerId);
  const leadActivities = activities.filter((a) => a.leadId === lead.id);

  const handleCopy = async (text: string, field: 'email' | 'phone') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // Fallback silencioso
    }
  };

  const handleSaveNotes = () => {
    onUpdateNotes(lead.id, notesDraft);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 1800);
  };

  const handleAddQuickActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActTitle.trim()) return;
    onAddActivity({
      leadId: lead.id,
      type: newActType,
      title: newActTitle.trim(),
      description: `Follow-up registrado na ficha de ${lead.company}.`,
      dueDate: newActDate,
      dueTime: '14:00',
      ownerId: lead.ownerId,
    });
    setNewActTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-[#050811]/70 backdrop-blur-sm cursor-pointer"
      />

      {/* Drawer Lateral Glacier Elevado */}
      <aside
        aria-label={`Detalhes de ${lead.company}`}
        className="glass-panel-elevated relative z-10 flex h-full w-full max-w-xl flex-col border-l border-[#7dd3fc]/20 border-y-0 border-r-0"
      >
        {/* Cabeçalho Fixo */}
        <div className="flex items-start justify-between gap-4 border-b border-[#7dd3fc]/12 p-5 sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#7dd3fc]">
              {lead.segment} · {lead.origin}
            </p>
            <h2 className="mt-1 truncate font-display text-xl font-semibold text-slate-50">
              {lead.company}
            </h2>
            <p className="mt-0.5 text-sm text-slate-300">
              {lead.name} — {lead.role}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onAskAssistant && (
              <button
                type="button"
                onClick={() => onAskAssistant(lead)}
                title="Abrir Assistente Comercial para este lead"
                className="flex h-9 items-center gap-1.5 rounded-xl border border-[#c8a0f0]/35 bg-[#c8a0f0]/12 px-3 text-xs font-medium text-[#e9d5ff] hover:border-[#c8a0f0]/60 hover:bg-[#c8a0f0]/20 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#c8a0f0]" />
                <span>IA</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onEditLead(lead)}
              aria-label="Editar lead"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:border-[#7dd3fc]/40 hover:text-[#7dd3fc] transition-colors cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar painel"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:border-[#7dd3fc]/40 hover:text-slate-50 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Conteúdo Rolável */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Métricas do Negócio */}
          <div className="grid grid-cols-3 gap-3 border-b border-[#7dd3fc]/10 pb-5">
            <div>
              <p className="text-xs text-slate-400">Valor Estimado</p>
              <p className="mt-1 font-mono text-lg font-semibold text-[#7dd3fc] tabular-nums">
                {formatBRL(lead.value)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Probabilidade</p>
              <p className="mt-1 font-mono text-lg font-semibold text-slate-100 tabular-nums">
                {lead.probability}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Prioridade</p>
              <p className="mt-1 text-base font-semibold text-[#c8a0f0]">
                {lead.priority}
              </p>
            </div>
          </div>

          {/* Seletor de Etapa do Funil */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2.5">
              Etapa Atual do Funil
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PIPELINE_STAGES.map((stage) => {
                const active = lead.stage === stage.id;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => onMoveStage(lead.id, stage.id)}
                    className={cn(
                      'rounded-xl px-3 py-2 text-xs font-medium text-left transition-all cursor-pointer whitespace-nowrap truncate',
                      active
                        ? 'glass-btn-primary text-[#e0f2fe]'
                        : 'glass-btn-secondary text-slate-300'
                    )}
                  >
                    {stage.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dados de Contato e Responsável */}
          <div className="space-y-3 border-t border-[#7dd3fc]/10 pt-5">
            <p className="text-xs font-medium text-slate-400">
              Informações de Contato
            </p>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2.5 text-slate-200 truncate">
                <Mail className="h-4 w-4 shrink-0 text-[#7dd3fc]" />
                <span className="truncate">{lead.email}</span>
              </span>
              <button
                type="button"
                onClick={() => handleCopy(lead.email, 'email')}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/[0.06] hover:text-[#7dd3fc] transition-colors cursor-pointer shrink-0"
              >
                {copiedField === 'email' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span className="text-emerald-300">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2.5 text-slate-200 font-mono tabular-nums">
                <Phone className="h-4 w-4 shrink-0 text-[#7dd3fc]" />
                <span>{lead.phone}</span>
              </span>
              <button
                type="button"
                onClick={() => handleCopy(lead.phone, 'phone')}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/[0.06] hover:text-[#7dd3fc] transition-colors cursor-pointer shrink-0"
              >
                {copiedField === 'phone' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span className="text-emerald-300">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
              <span className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-[#c8a0f0]" />
                <span>{lead.city}</span>
              </span>
              <span className="flex items-center gap-2 text-xs text-slate-400">
                <TeamAvatar member={owner} size="xs" />
                <span>{owner.name}</span>
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-400 pt-1">
              <CalendarClock className="h-4 w-4 shrink-0 text-[#c8a0f0]" />
              <span>
                Próxima ação:{' '}
                <strong className="text-slate-200">{lead.nextAction}</strong> em{' '}
                <span className="font-mono text-[#7dd3fc] tabular-nums">
                  {formatDateBR(lead.nextActionDate)}
                </span>
              </span>
            </div>
          </div>

          {/* Anotações Comerciais */}
          <div className="space-y-2.5 border-t border-[#7dd3fc]/10 pt-5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="lead-notes-textarea"
                className="text-xs font-medium text-slate-400"
              >
                Anotações da Negociação
              </label>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="text-xs font-medium text-[#7dd3fc] hover:text-[#bae6fd] transition-colors cursor-pointer"
              >
                {notesSaved ? 'Anotações salvas' : 'Salvar anotações'}
              </button>
            </div>
            <textarea
              id="lead-notes-textarea"
              rows={3}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="Registre objeções, requisitos técnicos ou próximos passos..."
              className="glass-input w-full rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 resize-y"
            />
          </div>

          {/* Atividades deste Lead */}
          <div className="space-y-3 border-t border-[#7dd3fc]/10 pt-5">
            <p className="text-xs font-medium text-slate-400">
              Histórico e Follow-ups ({leadActivities.length})
            </p>

            <form
              onSubmit={handleAddQuickActivity}
              className="flex flex-col sm:flex-row gap-2"
            >
              <select
                aria-label="Tipo da atividade"
                value={newActType}
                onChange={(e) => setNewActType(e.target.value as ActivityType)}
                className="glass-input rounded-xl px-3 py-2 text-xs text-slate-100 cursor-pointer"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#0f1524]">
                    {t}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newActTitle}
                onChange={(e) => setNewActTitle(e.target.value)}
                placeholder="Registrar nova interação..."
                className="glass-input flex-1 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500"
              />
              <input
                type="date"
                aria-label="Data da atividade"
                value={newActDate}
                onChange={(e) => setNewActDate(e.target.value)}
                className="glass-input rounded-xl px-2.5 py-2 text-xs font-mono text-slate-100 cursor-pointer"
              />
              <button
                type="submit"
                aria-label="Adicionar atividade"
                className="glass-btn-primary flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Incluir</span>
              </button>
            </form>

            {leadActivities.length === 0 ? (
              <p className="py-4 text-xs text-slate-500">
                Nenhuma interação registrada para este lead ainda.
              </p>
            ) : (
              <div className="divide-y divide-[#7dd3fc]/8">
                {leadActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 py-3">
                    <button
                      type="button"
                      onClick={() => onToggleActivity(act.id)}
                      className="mt-0.5 shrink-0 text-slate-400 hover:text-[#7dd3fc] cursor-pointer"
                    >
                      {act.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-xs font-medium',
                          act.completed
                            ? 'text-slate-500 line-through'
                            : 'text-slate-100'
                        )}
                      >
                        {act.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400 font-mono tabular-nums">
                        {act.type} · {formatShortDateBR(act.dueDate)} às{' '}
                        {act.dueTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Exclusão Segura */}
        <div className="flex items-center justify-between gap-3 border-t border-[#7dd3fc]/12 px-5 py-4 sm:px-6">
          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
            Atualizado em {formatDateBR(lead.updatedAt)}
          </span>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-200 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Excluir lead</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="glass-btn-secondary rounded-xl px-3 py-1.5 text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => onDeleteLead(lead.id)}
                className="rounded-xl border border-rose-400/40 bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-500/30 transition-colors cursor-pointer"
              >
                Confirmar exclusão
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export function LeadDetailDrawer(props: LeadDetailDrawerProps) {
  if (!props.lead) return null;
  return (
    <LeadDetailDrawerInner
      key={`${props.lead.id}-${props.lead.updatedAt}`}
      {...props}
      lead={props.lead}
    />
  );
}
