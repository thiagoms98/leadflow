'use client';

import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Phone,
  Video,
  Mail,
  FileText,
  StickyNote,
  Trash2,
  ArrowUpRight,
} from 'lucide-react';
import {
  ACTIVITY_TYPES,
  formatShortDateBR,
  getTeamMember,
  type ActivityType,
  type Lead,
  type LeadActivity,
} from '@/lib/leadflow-data';
import { TeamAvatar } from './TeamAvatar';
import { cn } from '@/lib/utils';

interface ActivitiesViewProps {
  activities: LeadActivity[];
  leads: Lead[];
  onToggleActivity: (activityId: string) => void;
  onAddActivity: (activity: Omit<LeadActivity, 'id' | 'completed'>) => void;
  onDeleteActivity: (activityId: string) => void;
  onSelectLead: (leadId: string) => void;
}

const TYPE_ICON: Record<ActivityType, typeof Phone> = {
  Ligação: Phone,
  Reunião: Video,
  'E-mail': Mail,
  Proposta: FileText,
  Nota: StickyNote,
};

export function ActivitiesView({
  activities,
  leads,
  onToggleActivity,
  onAddActivity,
  onDeleteActivity,
  onSelectLead,
}: ActivitiesViewProps) {
  const [statusFilter, setStatusFilter] = useState<
    'todas' | 'pendentes' | 'concluidas'
  >('pendentes');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [showComposer, setShowComposer] = useState(false);

  const [leadId, setLeadId] = useState<string>(leads[0]?.id ?? '');
  const [type, setType] = useState<ActivityType>('Ligação');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('2026-11-18');
  const [dueTime, setDueTime] = useState('14:00');
  const [formError, setFormError] = useState('');

  const filtered = useMemo(() => {
    return [...activities]
      .filter((a) => {
        if (statusFilter === 'pendentes' && a.completed) return false;
        if (statusFilter === 'concluidas' && !a.completed) return false;
        if (typeFilter !== 'todos' && a.type !== typeFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return `${a.dueDate} ${a.dueTime}`.localeCompare(
          `${b.dueDate} ${b.dueTime}`
        );
      });
  }, [activities, statusFilter, typeFilter]);

  const pendingCount = activities.filter((a) => !a.completed).length;
  const completedCount = activities.filter((a) => a.completed).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Informe um título para a atividade.');
      return;
    }
    const targetLeadId = leadId || leads[0]?.id;
    if (!targetLeadId) {
      setFormError('Cadastre ao menos um lead antes de criar uma atividade.');
      return;
    }
    const linked = leads.find((l) => l.id === targetLeadId);
    onAddActivity({
      leadId: targetLeadId,
      type,
      title: title.trim(),
      description:
        description.trim() ||
        `Acompanhamento comercial com ${linked?.company ?? 'cliente'}.`,
      dueDate,
      dueTime,
      ownerId: linked?.ownerId ?? 'tm-thiago',
    });
    setTitle('');
    setDescription('');
    setFormError('');
    setShowComposer(false);
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
            Agenda de Atividades
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Organize ligações, reuniões, envios de proposta e follow-ups da
            equipe.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowComposer((v) => !v)}
          className="glass-btn-primary flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>{showComposer ? 'Fechar formulário' : 'Nova Atividade'}</span>
        </button>
      </div>

      {/* Formulário rápido para nova atividade */}
      {showComposer && (
        <form
          onSubmit={handleSubmit}
          className="glass-panel-elevated rounded-2xl p-5 space-y-4"
        >
          <h2 className="font-display text-base font-semibold text-slate-100">
            Agendar Novo Follow-up
          </h2>
          {formError && (
            <p className="text-xs font-medium text-rose-300">{formError}</p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs text-slate-400 sm:col-span-2">
              <span>Título da Atividade *</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Enviar proposta revisada para diretoria"
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-slate-400">
              <span>Lead Relacionado</span>
              <select
                value={leadId || leads[0]?.id || ''}
                onChange={(e) => setLeadId(e.target.value)}
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 cursor-pointer"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id} className="bg-[#0f1524]">
                    {l.company} — {l.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-slate-400">
              <span>Tipo</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ActivityType)}
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 cursor-pointer"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#0f1524]">
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-slate-400 sm:col-span-2">
              <span>Observações</span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contexto ou pauta da interação"
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-slate-400">
              <span>Data</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono cursor-pointer"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-slate-400">
              <span>Horário</span>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono cursor-pointer"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="glass-btn-secondary rounded-xl px-4 py-2 text-xs font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="glass-btn-primary rounded-xl px-4 py-2 text-xs font-medium cursor-pointer"
            >
              Salvar Atividade
            </button>
          </div>
        </form>
      )}

      {/* Filtros de Atividade */}
      <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('pendentes')}
            className={cn(
              'rounded-xl px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer',
              statusFilter === 'pendentes'
                ? 'glass-btn-primary'
                : 'text-slate-300 hover:bg-white/[0.05]'
            )}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('concluidas')}
            className={cn(
              'rounded-xl px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer',
              statusFilter === 'concluidas'
                ? 'glass-btn-primary'
                : 'text-slate-300 hover:bg-white/[0.05]'
            )}
          >
            Concluídas ({completedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('todas')}
            className={cn(
              'rounded-xl px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer',
              statusFilter === 'todas'
                ? 'glass-btn-primary'
                : 'text-slate-300 hover:bg-white/[0.05]'
            )}
          >
            Todas ({activities.length})
          </button>
        </div>

        <select
          aria-label="Filtrar por tipo de atividade"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="glass-input rounded-xl px-3.5 py-2 text-xs text-slate-100 cursor-pointer"
        >
          <option value="todos" className="bg-[#0f1524]">
            Todos os tipos
          </option>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t} className="bg-[#0f1524]">
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Atividades */}
      <div className="glass-panel rounded-2xl divide-y divide-[#7dd3fc]/10">
        {filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="font-display text-sm font-semibold text-slate-100">
              Nenhuma atividade encontrada neste filtro
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Você está em dia com seus acompanhamentos comerciais.
            </p>
          </div>
        ) : (
          filtered.map((activity) => {
            const Icon = TYPE_ICON[activity.type] ?? StickyNote;
            const owner = getTeamMember(activity.ownerId);
            const linkedLead = leads.find((l) => l.id === activity.leadId);

            return (
              <div
                key={activity.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-white/[0.025] transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onToggleActivity(activity.id)}
                    aria-label={
                      activity.completed
                        ? 'Reabrir atividade'
                        : 'Concluir atividade'
                    }
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-[#7dd3fc] transition-colors cursor-pointer"
                  >
                    {activity.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-[#7dd3fc]" />
                      <h3
                        className={cn(
                          'text-sm font-medium',
                          activity.completed
                            ? 'text-slate-500 line-through'
                            : 'text-slate-100'
                        )}
                      >
                        {activity.title}
                      </h3>
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      {activity.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono text-[#c8a0f0] tabular-nums">
                        {formatShortDateBR(activity.dueDate)} às{' '}
                        {activity.dueTime}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{activity.type}</span>
                      {linkedLead && (
                        <>
                          <span aria-hidden="true">·</span>
                          <button
                            type="button"
                            onClick={() => onSelectLead(linkedLead.id)}
                            className="inline-flex items-center gap-1 font-medium text-[#7dd3fc] hover:text-[#bae6fd] transition-colors cursor-pointer"
                          >
                            <span>{linkedLead.company}</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0 shrink-0">
                  <div className="flex items-center gap-2">
                    <TeamAvatar member={owner} size="xs" />
                    <span className="text-xs text-slate-300">
                      {owner.shortName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteActivity(activity.id)}
                    aria-label="Excluir atividade"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-500 hover:border-rose-400/25 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
