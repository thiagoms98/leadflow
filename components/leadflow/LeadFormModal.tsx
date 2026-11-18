'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import {
  PIPELINE_STAGES,
  LEAD_ORIGINS,
  LEAD_PRIORITIES,
  TEAM_MEMBERS,
  getStageInfo,
  type Lead,
  type LeadOrigin,
  type LeadPriority,
  type PipelineStage,
} from '@/lib/leadflow-data';

interface LeadFormModalProps {
  open: boolean;
  editingLead: Lead | null;
  defaultStage: PipelineStage;
  onClose: () => void;
  onSave: (
    data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => void;
}

function LeadFormModalInner({
  editingLead,
  defaultStage,
  onClose,
  onSave,
}: Omit<LeadFormModalProps, 'open'>) {
  const [name, setName] = useState(editingLead?.name ?? '');
  const [role, setRole] = useState(editingLead?.role ?? '');
  const [company, setCompany] = useState(editingLead?.company ?? '');
  const [email, setEmail] = useState(editingLead?.email ?? '');
  const [phone, setPhone] = useState(editingLead?.phone ?? '');
  const [city, setCity] = useState(editingLead?.city ?? 'São Paulo, SP');
  const [segment, setSegment] = useState(editingLead?.segment ?? 'SaaS B2B');
  const [origin, setOrigin] = useState<LeadOrigin>(
    editingLead?.origin ?? 'Inbound / Site'
  );
  const [stage, setStage] = useState<PipelineStage>(
    editingLead?.stage ?? defaultStage
  );
  const [priority, setPriority] = useState<LeadPriority>(
    editingLead?.priority ?? 'Média'
  );
  const [value, setValue] = useState(String(editingLead?.value ?? 45000));
  const [probability, setProbability] = useState(
    String(
      editingLead?.probability ?? getStageInfo(defaultStage).defaultProbability
    )
  );
  const [ownerId, setOwnerId] = useState(
    editingLead?.ownerId ?? TEAM_MEMBERS[0].id
  );
  const [nextAction, setNextAction] = useState(
    editingLead?.nextAction ?? 'Realizar primeira reunião de qualificação'
  );
  const [nextActionDate, setNextActionDate] = useState(
    editingLead?.nextActionDate ?? '2026-11-19'
  );
  const [notes, setNotes] = useState(editingLead?.notes ?? '');
  const [error, setError] = useState('');

  const handleStageChange = (newStage: PipelineStage) => {
    setStage(newStage);
    if (!editingLead) {
      setProbability(String(getStageInfo(newStage).defaultProbability));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !name.trim()) {
      setError('Preencha pelo menos o nome do contato e o nome da empresa.');
      return;
    }
    const parsedValue = Math.max(0, Number(value) || 0);
    const parsedProb = Math.min(100, Math.max(0, Number(probability) || 0));

    onSave(
      {
        name: name.trim(),
        role: role.trim() || 'Decisor Comercial',
        company: company.trim(),
        email: email.trim() || 'contato@empresa.com.br',
        phone: phone.trim() || '(11) 99000-0000',
        city: city.trim() || 'São Paulo, SP',
        segment: segment.trim() || 'Serviços B2B',
        origin,
        stage,
        priority,
        value: parsedValue,
        probability: parsedProb,
        ownerId,
        nextAction: nextAction.trim() || 'Acompanhar retorno',
        nextActionDate: nextActionDate || '2026-11-19',
        notes: notes.trim(),
      },
      editingLead?.id
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-[#050811]/75 backdrop-blur-sm cursor-pointer"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
        className="glass-panel-elevated relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-[#7dd3fc]/12 px-6 py-4">
          <h2
            id="lead-modal-title"
            className="font-display text-lg font-semibold text-slate-50"
          >
            {editingLead ? 'Editar Oportunidade' : 'Cadastrar Novo Lead'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-slate-300 hover:border-[#7dd3fc]/40 hover:text-slate-50 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {error && (
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-xs font-medium text-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>Empresa *</span>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ex.: NovaTech Soluções"
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>Nome do Contato *</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Carolina Ferreira"
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>Cargo</span>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex.: Diretora Comercial"
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>Segmento</span>
              <input
                type="text"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                placeholder="Ex.: Fintech, Varejo, SaaS B2B"
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>E-mail Corporativo</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com.br"
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>Telefone / WhatsApp</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder:text-slate-500"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>Cidade / UF</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="São Paulo, SP"
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>Valor Estimado (R$)</span>
              <input
                type="number"
                min="0"
                step="500"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 tabular-nums"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>Etapa do Funil</span>
              <select
                value={stage}
                onChange={(e) =>
                  handleStageChange(e.target.value as PipelineStage)
                }
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 cursor-pointer"
              >
                {PIPELINE_STAGES.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#0f1524]">
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>Probabilidade (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 tabular-nums"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>Origem</span>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value as LeadOrigin)}
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 cursor-pointer"
              >
                {LEAD_ORIGINS.map((o) => (
                  <option key={o} value={o} className="bg-[#0f1524]">
                    {o}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>Prioridade</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as LeadPriority)}
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 cursor-pointer"
              >
                {LEAD_PRIORITIES.map((p) => (
                  <option key={p} value={p} className="bg-[#0f1524]">
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>Responsável</span>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 cursor-pointer"
              >
                {TEAM_MEMBERS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#0f1524]">
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300">
              <span>Data da Próxima Ação</span>
              <input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-100 cursor-pointer"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300 sm:col-span-2">
              <span>Próxima Ação Combinada</span>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="Ex.: Enviar proposta personalizada"
                className="glass-input rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs text-slate-300 sm:col-span-2">
              <span>Observações</span>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contexto inicial, necessidades e pontos de atenção..."
                className="glass-input rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 resize-y"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#7dd3fc]/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="glass-btn-secondary rounded-xl px-4 py-2.5 text-xs font-medium cursor-pointer whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="glass-btn-primary rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              {editingLead ? 'Salvar Alterações' : 'Cadastrar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LeadFormModal(props: LeadFormModalProps) {
  if (!props.open) return null;
  return (
    <LeadFormModalInner
      key={props.editingLead?.id ?? `new-${props.defaultStage}`}
      editingLead={props.editingLead}
      defaultStage={props.defaultStage}
      onClose={props.onClose}
      onSave={props.onSave}
    />
  );
}
