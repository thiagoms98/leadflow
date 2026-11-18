'use client';

import { useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Circle,
  TrendingUp,
  Briefcase,
  Target,
  Users,
  Calendar,
} from 'lucide-react';
import {
  PIPELINE_STAGES,
  MONTHLY_REVENUE_SERIES,
  formatBRL,
  formatShortDateBR,
  getStageInfo,
  getTeamMember,
  type Lead,
  type LeadActivity,
  type PipelineStage,
} from '@/lib/leadflow-data';
import { TeamAvatar } from './TeamAvatar';
import { cn } from '@/lib/utils';

interface OverviewViewProps {
  leads: Lead[];
  activities: LeadActivity[];
  onSelectLead: (leadId: string) => void;
  onToggleActivity: (activityId: string) => void;
  onNavigateToStage: (stage: PipelineStage) => void;
  onNavigateToActivities: () => void;
}

export function OverviewView({
  leads,
  activities,
  onSelectLead,
  onToggleActivity,
  onNavigateToStage,
  onNavigateToActivities,
}: OverviewViewProps) {
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(
    MONTHLY_REVENUE_SERIES.length - 1
  );

  // KPIs calculados dinamicamente a partir dos leads filtrados
  const openLeads = leads.filter((l) => l.stage !== 'fechado');
  const wonLeads = leads.filter((l) => l.stage === 'fechado');

  const pipelineValue = openLeads.reduce((acc, l) => acc + l.value, 0);
  const weightedForecast = openLeads.reduce(
    (acc, l) => acc + l.value * (l.probability / 100),
    0
  );
  const closedRevenue = wonLeads.reduce((acc, l) => acc + l.value, 0);
  const conversionRate =
    leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;

  // Dados do funil por etapa
  const stageStats = PIPELINE_STAGES.map((stage) => {
    const items = leads.filter((l) => l.stage === stage.id);
    const total = items.reduce((acc, l) => acc + l.value, 0);
    return {
      ...stage,
      count: items.length,
      total,
    };
  });
  const maxStageTotal = Math.max(...stageStats.map((s) => s.total), 1);

  // Oportunidades prioritárias (abertas, ordenadas por valor e probabilidade)
  const priorityLeads = [...openLeads]
    .sort((a, b) => {
      if (a.priority === 'Alta' && b.priority !== 'Alta') return -1;
      if (b.priority === 'Alta' && a.priority !== 'Alta') return 1;
      return b.value - a.value;
    })
    .slice(0, 5);

  // Próximos follow-ups pendentes
  const upcomingActivities = [...activities]
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.dueDate.localeCompare(b.dueDate);
    })
    .slice(0, 5);

  // Dimensões do gráfico SVG de evolução mensal
  const chartW = 540;
  const chartH = 190;
  const padX = 28;
  const padY = 22;
  const maxRev = Math.max(...MONTHLY_REVENUE_SERIES.map((m) => m.revenue));
  const minRev = Math.min(...MONTHLY_REVENUE_SERIES.map((m) => m.revenue)) * 0.78;

  const points = MONTHLY_REVENUE_SERIES.map((item, idx) => {
    const x =
      padX +
      (idx / (MONTHLY_REVENUE_SERIES.length - 1)) * (chartW - padX * 2);
    const ratio = (item.revenue - minRev) / (maxRev - minRev || 1);
    const y = chartH - padY - ratio * (chartH - padY * 2);
    return { ...item, x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(
    chartH - padY
  ).toFixed(1)} L ${points[0].x.toFixed(1)} ${(chartH - padY).toFixed(1)} Z`;

  const activePoint =
    hoveredMonthIdx !== null
      ? points[hoveredMonthIdx]
      : points[points.length - 1];

  return (
    <div className="space-y-6">
      {/* Cabeçalho executivo da Visão Geral */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50 text-balance">
            Pulso Comercial em Tempo Real
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Acompanhe receita projetada, gargalos do funil e follow-ups do dia.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
          <span>Previsão ponderada:</span>
          <span className="font-semibold text-[#7dd3fc]">
            {formatBRL(weightedForecast)}
          </span>
        </div>
      </div>

      {/* Strip de 4 KPIs principais */}
      <section
        aria-label="Indicadores principais"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Valor em Pipeline</span>
            <Briefcase className="h-4 w-4 text-[#7dd3fc]" />
          </div>
          <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-slate-50 tabular-nums">
            {formatBRL(pipelineValue)}
          </p>
          <p className="mt-2 text-xs text-slate-400 tabular-nums">
            {openLeads.length} oportunidades ativas em negociação
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Receita Fechada</span>
            <TrendingUp className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-slate-50 tabular-nums">
            {formatBRL(closedRevenue)}
          </p>
          <p className="mt-2 text-xs text-emerald-300/90 tabular-nums">
            +17,1% em relação ao mês anterior
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Taxa de Conversão</span>
            <Target className="h-4 w-4 text-[#c8a0f0]" />
          </div>
          <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-slate-50 tabular-nums">
            {conversionRate}%
          </p>
          <p className="mt-2 text-xs text-slate-400 tabular-nums">
            {wonLeads.length} contratos ganhos de {leads.length} leads
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Ticket Médio</span>
            <Users className="h-4 w-4 text-[#7dd3fc]" />
          </div>
          <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-slate-50 tabular-nums">
            {formatBRL(
              leads.length > 0
                ? leads.reduce((acc, l) => acc + l.value, 0) / leads.length
                : 0
            )}
          </p>
          <p className="mt-2 text-xs text-slate-400 tabular-nums">
            Ciclo médio de fechamento: 28 dias
          </p>
        </div>
      </section>

      {/* Grade Analítica: Funil por Etapa + Evolução Mensal */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Funil de Conversão */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 xl:col-span-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-100">
                Pipeline por Etapa do Funil
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Clique em uma etapa para abrir os negócios correspondentes
              </p>
            </div>
            <span className="font-mono text-xs text-[#7dd3fc] tabular-nums whitespace-nowrap">
              {leads.length} leads
            </span>
          </div>

          <div className="mt-5 space-y-3.5">
            {stageStats.map((stage) => {
              const widthPct = Math.max(
                8,
                Math.round((stage.total / maxStageTotal) * 100)
              );
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => onNavigateToStage(stage.id)}
                  className="group block w-full rounded-xl p-2.5 -mx-2.5 text-left transition-colors hover:bg-white/[0.04] cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-slate-200 group-hover:text-[#7dd3fc] transition-colors truncate">
                        {stage.label}
                      </span>
                      <span className="text-xs text-slate-500 tabular-nums">
                        · {stage.count}{' '}
                        {stage.count === 1 ? 'negócio' : 'negócios'}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-medium text-slate-200 tabular-nums shrink-0">
                      {formatBRL(stage.total)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${stage.total === 0 ? 2 : widthPct}%`,
                        background:
                          stage.id === 'fechado'
                            ? 'linear-gradient(90deg, rgba(110, 231, 183, 0.7), rgba(125, 211, 252, 0.85))'
                            : stage.id === 'proposta' || stage.id === 'negociacao'
                              ? 'linear-gradient(90deg, rgba(200, 160, 240, 0.7), rgba(125, 211, 252, 0.85))'
                              : 'linear-gradient(90deg, rgba(125, 211, 252, 0.55), rgba(125, 211, 252, 0.9))',
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gráfico SVG Interativo de Receita Mensal */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 xl:col-span-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-100">
                Receita Fechada e Captação
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Evolução dos últimos 6 meses de operação
              </p>
            </div>
            {activePoint && (
              <div className="text-right">
                <p className="font-mono text-sm font-semibold text-[#7dd3fc] tabular-nums">
                  {formatBRL(activePoint.revenue)}
                </p>
                <p className="text-xs text-slate-400 tabular-nums">
                  {activePoint.month}/2026 · {activePoint.leads} novos leads
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 w-full">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="h-48 w-full overflow-visible"
              role="img"
              aria-label="Gráfico de evolução de receita mensal"
            >
              <defs>
                <linearGradient id="glacierArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="glacierLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#c8a0f0" />
                  <stop offset="100%" stopColor="#7dd3fc" />
                </linearGradient>
              </defs>

              {/* Linhas de grade sutis */}
              {[0.25, 0.5, 0.75, 1].map((step) => {
                const y = padY + (1 - step) * (chartH - padY * 2);
                return (
                  <line
                    key={step}
                    x1={padX}
                    y1={y}
                    x2={chartW - padX}
                    y2={y}
                    stroke="rgba(125, 211, 252, 0.08)"
                    strokeDasharray="3 4"
                  />
                );
              })}

              <path d={areaPath} fill="url(#glacierArea)" />
              <path
                d={linePath}
                fill="none"
                stroke="url(#glacierLine)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {points.map((pt, idx) => {
                const isActive = hoveredMonthIdx === idx;
                return (
                  <g
                    key={pt.month}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredMonthIdx(idx)}
                    onClick={() => setHoveredMonthIdx(idx)}
                  >
                    {isActive && (
                      <line
                        x1={pt.x}
                        y1={padY}
                        x2={pt.x}
                        y2={chartH - padY}
                        stroke="rgba(125, 211, 252, 0.25)"
                        strokeWidth="1"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isActive ? 6 : 4}
                      fill={isActive ? '#7dd3fc' : '#0f1524'}
                      stroke="#7dd3fc"
                      strokeWidth="2"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={18}
                      fill="transparent"
                    />
                    <text
                      x={pt.x}
                      y={chartH - 3}
                      textAnchor="middle"
                      className="fill-slate-400 text-[11px] font-mono"
                    >
                      {pt.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#7dd3fc]/10 pt-3 text-xs text-slate-400">
            <span>Crescimento acumulado no semestre</span>
            <span className="font-mono font-medium text-[#c8a0f0] tabular-nums">
              +85,2% em receita mensal
            </span>
          </div>
        </div>
      </section>

      {/* Rodapé Operacional: Oportunidades Prioritárias & Próximos Follow-ups */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Oportunidades Prioritárias */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 xl:col-span-7">
          <div className="flex items-center justify-between gap-4 border-b border-[#7dd3fc]/10 pb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-100">
                Oportunidades Prioritárias
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Negócios abertos com maior potencial de fechamento
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToStage('negociacao')}
              className="flex items-center gap-1 text-xs font-medium text-[#7dd3fc] hover:text-[#bae6fd] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Ver pipeline</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {priorityLeads.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              Nenhuma oportunidade em aberto para este filtro.
            </div>
          ) : (
            <div className="divide-y divide-[#7dd3fc]/8">
              {priorityLeads.map((lead) => {
                const stage = getStageInfo(lead.stage);
                const owner = getTeamMember(lead.ownerId);
                return (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => onSelectLead(lead.id)}
                    className="group flex w-full items-center justify-between gap-4 py-3.5 px-2 -mx-2 rounded-xl text-left transition-colors hover:bg-white/[0.04] cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <TeamAvatar member={owner} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100 group-hover:text-[#7dd3fc] transition-colors">
                          {lead.company}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {lead.name} · {stage.label} · {lead.origin}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-semibold text-slate-100 tabular-nums">
                        {formatBRL(lead.value)}
                      </p>
                      <p className="font-mono text-xs text-slate-400 tabular-nums">
                        {lead.probability}% prob.
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Próximos Follow-ups */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 xl:col-span-5">
          <div className="flex items-center justify-between gap-4 border-b border-[#7dd3fc]/10 pb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-100">
                Próximos Follow-ups
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Marque como concluído conforme avançar no dia
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToActivities}
              className="flex items-center gap-1 text-xs font-medium text-[#7dd3fc] hover:text-[#bae6fd] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Agenda</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {upcomingActivities.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              Nenhuma atividade agendada no momento.
            </div>
          ) : (
            <div className="divide-y divide-[#7dd3fc]/8">
              {upcomingActivities.map((activity) => {
                const linkedLead = leads.find((l) => l.id === activity.leadId);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 py-3.5"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleActivity(activity.id)}
                      aria-label={
                        activity.completed
                          ? 'Marcar atividade como pendente'
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
                      <button
                        type="button"
                        onClick={() => {
                          if (linkedLead) onSelectLead(linkedLead.id);
                        }}
                        className={cn(
                          'text-left text-sm font-medium transition-colors cursor-pointer line-clamp-1',
                          activity.completed
                            ? 'text-slate-500 line-through'
                            : 'text-slate-100 hover:text-[#7dd3fc]'
                        )}
                      >
                        {activity.title}
                      </button>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                        <Calendar className="h-3 w-3 text-[#c8a0f0]" />
                        <span>
                          {formatShortDateBR(activity.dueDate)} ·{' '}
                          {activity.dueTime}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-sans">{activity.type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
