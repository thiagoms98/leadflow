'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  GripVertical,
  CalendarClock,
} from 'lucide-react';
import {
  PIPELINE_STAGES,
  formatBRL,
  formatShortDateBR,
  getTeamMember,
  type Lead,
  type PipelineStage,
} from '@/lib/leadflow-data';
import { TeamAvatar } from './TeamAvatar';
import { cn } from '@/lib/utils';

interface PipelineBoardProps {
  leads: Lead[];
  initialFocusedStage?: PipelineStage;
  onMoveLeadStage: (leadId: string, newStage: PipelineStage) => void;
  onSelectLead: (leadId: string) => void;
  onNewLeadInStage: (stage: PipelineStage) => void;
}

export function PipelineBoard({
  leads,
  initialFocusedStage = 'novo',
  onMoveLeadStage,
  onSelectLead,
  onNewLeadInStage,
}: PipelineBoardProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  const [mobileStage, setMobileStage] = useState<PipelineStage>(initialFocusedStage);

  const totalPipelineValue = leads.reduce((sum, l) => sum + l.value, 0);

  const handleDropOnStage = (stageId: PipelineStage) => {
    if (draggedLeadId) {
      onMoveLeadStage(draggedLeadId, stageId);
    }
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const renderLeadCard = (lead: Lead, stageIdx: number) => {
    const owner = getTeamMember(lead.ownerId);
    const prevStage = stageIdx > 0 ? PIPELINE_STAGES[stageIdx - 1] : null;
    const nextStage =
      stageIdx < PIPELINE_STAGES.length - 1
        ? PIPELINE_STAGES[stageIdx + 1]
        : null;

    return (
      <div
        key={lead.id}
        draggable
        onDragStart={(e) => {
          setDraggedLeadId(lead.id);
          e.dataTransfer.setData('text/plain', lead.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => {
          setDraggedLeadId(null);
          setDragOverStage(null);
        }}
        onClick={() => onSelectLead(lead.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectLead(lead.id);
          }
        }}
        className={cn(
          'glass-card-interactive group rounded-xl p-4 text-left cursor-pointer select-none',
          draggedLeadId === lead.id && 'opacity-45 scale-[0.98]'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-sm font-semibold text-slate-50 group-hover:text-[#7dd3fc] transition-colors">
              {lead.company}
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-300">
              {lead.name} · {lead.role}
            </p>
          </div>
          <GripVertical
            className="h-4 w-4 shrink-0 text-slate-500 opacity-60 group-hover:opacity-100"
            aria-hidden="true"
          />
        </div>

        {/* Metadados limpos sem pílulas */}
        <p className="mt-2.5 truncate text-xs text-slate-400">
          {lead.segment} · {lead.origin} ·{' '}
          <span
            className={cn(
              lead.priority === 'Alta'
                ? 'text-[#7dd3fc] font-medium'
                : lead.priority === 'Média'
                  ? 'text-[#c8a0f0]'
                  : 'text-slate-400'
            )}
          >
            Prioridade {lead.priority}
          </span>
        </p>

        {/* Valor & Responsável */}
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-[#7dd3fc]/10 pt-3">
          <div>
            <p className="font-mono text-sm font-semibold text-slate-100 tabular-nums">
              {formatBRL(lead.value)}
            </p>
            <p className="font-mono text-[11px] text-slate-400 tabular-nums">
              {lead.probability}% de chance
            </p>
          </div>
          <TeamAvatar member={owner} size="sm" />
        </div>

        {/* Próxima Ação + Controles rápidos de movimentação */}
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 truncate">
            <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[#c8a0f0]" />
            <span className="truncate font-mono text-[11px] tabular-nums">
              {formatShortDateBR(lead.nextActionDate)}
            </span>
            <span className="truncate font-sans">{lead.nextAction}</span>
          </span>

          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {prevStage && (
              <button
                type="button"
                title={`Mover para ${prevStage.label}`}
                aria-label={`Mover ${lead.company} para ${prevStage.label}`}
                onClick={() => onMoveLeadStage(lead.id, prevStage.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#7dd3fc]/40 hover:bg-[#7dd3fc]/15 hover:text-[#7dd3fc] transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            )}
            {nextStage && (
              <button
                type="button"
                title={`Avançar para ${nextStage.label}`}
                aria-label={`Avançar ${lead.company} para ${nextStage.label}`}
                onClick={() => onMoveLeadStage(lead.id, nextStage.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#7dd3fc]/40 hover:bg-[#7dd3fc]/15 hover:text-[#7dd3fc] transition-colors cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho do Pipeline */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
            Pipeline Comercial
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Arraste os cartões entre etapas ou use as setas para avançar cada
            negociação.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400 font-mono tabular-nums">
          <span>
            {leads.length} {leads.length === 1 ? 'negócio' : 'negócios'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-sm font-semibold text-[#7dd3fc]">
            {formatBRL(totalPipelineValue)}
          </span>
        </div>
      </div>

      {/* Seletor de Etapa para Mobile (< md) */}
      <div className="md:hidden">
        <div
          role="tablist"
          aria-label="Etapas do funil"
          className="flex items-center gap-1.5 overflow-x-auto pb-2"
        >
          {PIPELINE_STAGES.map((stage) => {
            const count = leads.filter((l) => l.stage === stage.id).length;
            const active = mobileStage === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMobileStage(stage.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer',
                  active
                    ? 'glass-btn-primary text-[#e0f2fe]'
                    : 'glass-btn-secondary text-slate-300'
                )}
              >
                <span>{stage.shortLabel}</span>
                <span className="font-mono text-[11px] opacity-80 tabular-nums">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Coluna Ativa no Mobile */}
        {(() => {
          const stageIdx = PIPELINE_STAGES.findIndex(
            (s) => s.id === mobileStage
          );
          const stage = PIPELINE_STAGES[Math.max(0, stageIdx)];
          const stageLeads = leads.filter((l) => l.stage === stage.id);
          const stageTotal = stageLeads.reduce((s, l) => s + l.value, 0);

          return (
            <div className="glass-panel mt-2 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#7dd3fc]/10 pb-3">
                <div>
                  <h2 className="font-display text-sm font-semibold text-slate-100">
                    {stage.label}
                  </h2>
                  <p className="font-mono text-xs text-[#7dd3fc] tabular-nums">
                    {formatBRL(stageTotal)} · {stageLeads.length}{' '}
                    {stageLeads.length === 1 ? 'lead' : 'leads'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNewLeadInStage(stage.id)}
                  className="glass-btn-secondary flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>

              {stageLeads.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">
                  Nenhum negócio nesta etapa.
                </div>
              ) : (
                <div className="space-y-3">
                  {stageLeads.map((lead) => renderLeadCard(lead, stageIdx))}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Kanban Multi-Coluna Responsivo (md+) */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 items-start">
        {PIPELINE_STAGES.map((stage, stageIdx) => {
          const stageLeads = leads.filter((l) => l.stage === stage.id);
          const stageTotal = stageLeads.reduce((acc, l) => acc + l.value, 0);
          const isDropTarget = dragOverStage === stage.id;

          return (
            <section
              key={stage.id}
              aria-label={`Etapa ${stage.label}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverStage !== stage.id) setDragOverStage(stage.id);
              }}
              onDragLeave={() => {
                if (dragOverStage === stage.id) setDragOverStage(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDropOnStage(stage.id);
              }}
              className={cn(
                'glass-panel flex min-h-[420px] flex-col rounded-2xl p-3.5 transition-all duration-200',
                isDropTarget &&
                  'border-[#7dd3fc]/55 bg-[#7dd3fc]/[0.07] shadow-[0_0_32px_rgba(125,211,252,0.14)]'
              )}
            >
              {/* Cabeçalho da Coluna */}
              <div className="flex items-start justify-between gap-2 border-b border-[#7dd3fc]/10 pb-3 px-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-display text-sm font-semibold text-slate-100">
                      {stage.label}
                    </h2>
                    <span className="font-mono text-xs text-slate-400 tabular-nums">
                      {stageLeads.length}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs font-medium text-[#7dd3fc] tabular-nums">
                    {formatBRL(stageTotal)}
                  </p>
                </div>

                <button
                  type="button"
                  title={`Novo lead em ${stage.label}`}
                  aria-label={`Novo lead em ${stage.label}`}
                  onClick={() => onNewLeadInStage(stage.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 hover:border-[#7dd3fc]/35 hover:text-[#7dd3fc] transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Cartões da Coluna */}
              <div className="mt-3 flex-1 space-y-3">
                {stageLeads.length === 0 ? (
                  <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-[#7dd3fc]/15 px-4 text-center">
                    <p className="text-xs text-slate-400">
                      Arraste um lead para cá ou crie um novo negócio.
                    </p>
                  </div>
                ) : (
                  stageLeads.map((lead) => renderLeadCard(lead, stageIdx))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
