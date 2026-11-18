'use client';

import { useState, useMemo } from 'react';
import {
  Download,
  ArrowUpDown,
  Plus,
  FilterX,
  ChevronRight,
} from 'lucide-react';
import {
  PIPELINE_STAGES,
  LEAD_ORIGINS,
  LEAD_PRIORITIES,
  formatBRL,
  formatDateBR,
  getStageInfo,
  getTeamMember,
  type Lead,
  type PipelineStage,
} from '@/lib/leadflow-data';
import { TeamAvatar } from './TeamAvatar';
import { cn } from '@/lib/utils';

interface LeadsTableViewProps {
  leads: Lead[];
  initialStageFilter?: PipelineStage | 'todos';
  onSelectLead: (leadId: string) => void;
  onMoveLeadStage: (leadId: string, newStage: PipelineStage) => void;
  onOpenNewLead: () => void;
  onClearGlobalSearch: () => void;
}

type SortField = 'value' | 'updatedAt' | 'probability' | 'company';

export function LeadsTableView({
  leads,
  initialStageFilter = 'todos',
  onSelectLead,
  onMoveLeadStage,
  onOpenNewLead,
  onClearGlobalSearch,
}: LeadsTableViewProps) {
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'todos'>(
    initialStageFilter
  );
  const [originFilter, setOriginFilter] = useState<string>('todas');
  const [priorityFilter, setPriorityFilter] = useState<string>('todas');
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortDesc, setSortDesc] = useState<boolean>(true);

  const filteredLeads = useMemo(() => {
    const result = leads.filter((lead) => {
      if (stageFilter !== 'todos' && lead.stage !== stageFilter) return false;
      if (originFilter !== 'todas' && lead.origin !== originFilter) return false;
      if (priorityFilter !== 'todas' && lead.priority !== priorityFilter)
        return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'value') cmp = a.value - b.value;
      else if (sortField === 'probability') cmp = a.probability - b.probability;
      else if (sortField === 'updatedAt')
        cmp = a.updatedAt.localeCompare(b.updatedAt);
      else cmp = a.company.localeCompare(b.company, 'pt-BR');
      return sortDesc ? -cmp : cmp;
    });

    return result;
  }, [leads, stageFilter, originFilter, priorityFilter, sortField, sortDesc]);

  const totalFilteredValue = filteredLeads.reduce((acc, l) => acc + l.value, 0);

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDesc((prev) => !prev);
    } else {
      setSortField(field);
      setSortDesc(field !== 'company');
    }
  };

  const handleResetFilters = () => {
    setStageFilter('todos');
    setOriginFilter('todas');
    setPriorityFilter('todas');
    onClearGlobalSearch();
  };

  const handleExportCsv = () => {
    const headers = [
      'Empresa',
      'Contato',
      'Cargo',
      'E-mail',
      'Telefone',
      'Cidade',
      'Segmento',
      'Origem',
      'Etapa',
      'Prioridade',
      'Valor (BRL)',
      'Probabilidade (%)',
      'Responsável',
      'Próxima Ação',
      'Data Próxima Ação',
    ];

    const escapeCell = (val: string | number) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = filteredLeads.map((l) => [
      l.company,
      l.name,
      l.role,
      l.email,
      l.phone,
      l.city,
      l.segment,
      l.origin,
      getStageInfo(l.stage).label,
      l.priority,
      l.value,
      l.probability,
      getTeamMember(l.ownerId).name,
      l.nextAction,
      formatDateBR(l.nextActionDate),
    ]);

    const csvContent =
      '\uFEFF' +
      [headers, ...rows].map((row) => row.map(escapeCell).join(';')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `leadflow-leads-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho da Lista de Leads */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
            Base de Leads
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Pesquise, filtre por etapa ou origem e gerencie cada contato
            comercial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs text-slate-400 tabular-nums">
            {filteredLeads.length}{' '}
            {filteredLeads.length === 1 ? 'resultado' : 'resultados'} ·{' '}
            <strong className="text-[#7dd3fc]">
              {formatBRL(totalFilteredValue)}
            </strong>
          </span>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredLeads.length === 0}
            className="glass-btn-secondary flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-[#7dd3fc]" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        {/* Abas de Etapa */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setStageFilter('todos')}
            className={cn(
              'rounded-xl px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer',
              stageFilter === 'todos'
                ? 'glass-btn-primary'
                : 'text-slate-300 hover:bg-white/[0.05] hover:text-slate-50'
            )}
          >
            Todas as Etapas
          </button>
          {PIPELINE_STAGES.map((stage) => {
            const active = stageFilter === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setStageFilter(stage.id)}
                className={cn(
                  'rounded-xl px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer',
                  active
                    ? 'glass-btn-primary'
                    : 'text-slate-300 hover:bg-white/[0.05] hover:text-slate-50'
                )}
              >
                {stage.label}
              </button>
            );
          })}
        </div>

        {/* Filtros Secundários */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            <span>Origem do Lead</span>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 cursor-pointer"
            >
              <option value="todas" className="bg-[#0f1524]">
                Todas as origens
              </option>
              {LEAD_ORIGINS.map((origin) => (
                <option key={origin} value={origin} className="bg-[#0f1524]">
                  {origin}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-slate-400">
            <span>Prioridade</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 cursor-pointer"
            >
              <option value="todas" className="bg-[#0f1524]">
                Todas as prioridades
              </option>
              {LEAD_PRIORITIES.map((p) => (
                <option key={p} value={p} className="bg-[#0f1524]">
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-slate-400">
            <span>Ordenar por</span>
            <select
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value as SortField);
                setSortDesc(e.target.value !== 'company');
              }}
              className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 cursor-pointer"
            >
              <option value="value" className="bg-[#0f1524]">
                Maior valor (R$)
              </option>
              <option value="probability" className="bg-[#0f1524]">
                Probabilidade de fechamento
              </option>
              <option value="updatedAt" className="bg-[#0f1524]">
                Atualização mais recente
              </option>
              <option value="company" className="bg-[#0f1524]">
                Nome da empresa (A–Z)
              </option>
            </select>
          </label>
        </div>
      </div>

      {/* Estado Vazio */}
      {filteredLeads.length === 0 ? (
        <div className="glass-panel rounded-2xl px-6 py-16 text-center">
          <p className="font-display text-base font-semibold text-slate-100">
            Nenhum lead encontrado com os filtros atuais
          </p>
          <p className="mt-1.5 text-sm text-slate-400">
            Ajuste os filtros aplicados ou cadastre uma nova oportunidade
            comercial.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="glass-btn-secondary flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium cursor-pointer whitespace-nowrap"
            >
              <FilterX className="h-4 w-4" />
              <span>Limpar filtros</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewLead}
              className="glass-btn-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Cadastrar primeiro lead</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Tabela Desktop (md+) */}
          <div className="hidden md:block glass-panel overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#7dd3fc]/12 text-xs font-medium text-slate-400">
                    <th className="py-3.5 pl-5 pr-3">
                      <button
                        type="button"
                        onClick={() => handleSortToggle('company')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <span>Empresa & Contato</span>
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-3 py-3.5 whitespace-nowrap">Etapa</th>
                    <th className="px-3 py-3.5 whitespace-nowrap">Origem</th>
                    <th className="px-3 py-3.5 whitespace-nowrap">
                      Responsável
                    </th>
                    <th className="px-3 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleSortToggle('value')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <span>Valor</span>
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="px-3 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleSortToggle('probability')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <span>Prob.</span>
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                      Próx. Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#7dd3fc]/8">
                  {filteredLeads.map((lead) => {
                    const owner = getTeamMember(lead.ownerId);
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => onSelectLead(lead.id)}
                        className="group transition-colors hover:bg-[#7dd3fc]/[0.04] cursor-pointer"
                      >
                        <td className="py-3.5 pl-5 pr-3">
                          <p className="font-medium text-slate-100 group-hover:text-[#7dd3fc] transition-colors">
                            {lead.company}
                          </p>
                          <p className="text-xs text-slate-400">
                            {lead.name} · {lead.city}
                          </p>
                        </td>

                        <td
                          className="px-3 py-3.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            aria-label={`Etapa de ${lead.company}`}
                            value={lead.stage}
                            onChange={(e) =>
                              onMoveLeadStage(
                                lead.id,
                                e.target.value as PipelineStage
                              )
                            }
                            className="glass-input rounded-lg px-2.5 py-1.5 text-xs text-slate-100 cursor-pointer"
                          >
                            {PIPELINE_STAGES.map((s) => (
                              <option
                                key={s.id}
                                value={s.id}
                                className="bg-[#0f1524]"
                              >
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-3 py-3.5 text-xs text-slate-300 whitespace-nowrap">
                          {lead.origin}
                          <span className="block text-[11px] text-slate-500">
                            Prioridade {lead.priority}
                          </span>
                        </td>

                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2">
                            <TeamAvatar member={owner} size="xs" />
                            <span className="text-xs text-slate-200 whitespace-nowrap">
                              {owner.shortName}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3.5 text-right font-mono text-sm font-semibold text-slate-100 tabular-nums whitespace-nowrap">
                          {formatBRL(lead.value)}
                        </td>

                        <td className="px-3 py-3.5 text-right font-mono text-xs text-slate-300 tabular-nums whitespace-nowrap">
                          {lead.probability}%
                        </td>

                        <td className="py-3.5 pl-3 pr-5 text-right font-mono text-xs text-slate-400 tabular-nums whitespace-nowrap">
                          {formatDateBR(lead.nextActionDate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lista Mobile em Cartões (< md) */}
          <div className="space-y-3 md:hidden">
            {filteredLeads.map((lead) => {
              const owner = getTeamMember(lead.ownerId);
              const stage = getStageInfo(lead.stage);
              return (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => onSelectLead(lead.id)}
                  className="glass-card-interactive block w-full rounded-2xl p-4 text-left cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-sm font-semibold text-slate-50">
                        {lead.company}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {lead.name} · {stage.label}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#7dd3fc]/10 pt-3">
                    <div className="flex items-center gap-2">
                      <TeamAvatar member={owner} size="xs" />
                      <span className="text-xs text-slate-300">
                        {lead.origin} · {lead.priority}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-[#7dd3fc] tabular-nums">
                      {formatBRL(lead.value)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
