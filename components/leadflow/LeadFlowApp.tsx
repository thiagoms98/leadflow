'use client';

import { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Search, Plus, X, CheckCircle2 } from 'lucide-react';
import {
  INITIAL_LEADS,
  INITIAL_ACTIVITIES,
  getStageInfo,
  getTeamMember,
  type Lead,
  type LeadActivity,
  type PipelineStage,
} from '@/lib/leadflow-data';
import {
  subscribeSession,
  getSessionSnapshot,
  getSessionServerSnapshot,
  logoutSession,
} from '@/lib/leadflow-auth';
import {
  fetchWorkspaceFromSupabase,
  createLeadInSupabase,
  updateLeadInSupabase,
  deleteLeadInSupabase,
  createActivityInSupabase,
  toggleActivityInSupabase,
  deleteActivityInSupabase,
  seedDemoWorkspaceInSupabase,
} from '@/lib/leadflow-supabase-repo';
import { Sidebar, type NavSection } from './Sidebar';
import { OverviewView } from './OverviewView';
import { PipelineBoard } from './PipelineBoard';
import { LeadsTableView } from './LeadsTableView';
import { ActivitiesView } from './ActivitiesView';
import { LeadDetailDrawer } from './LeadDetailDrawer';
import { LeadFormModal } from './LeadFormModal';
import { AuthScreen } from './AuthScreen';

const STORAGE_LEADS_KEY = 'leadflow_leads_v1';
const STORAGE_ACTIVITIES_KEY = 'leadflow_activities_v1';

const SECTION_LABELS: Record<NavSection, string> = {
  'visao-geral': 'Visão Geral',
  pipeline: 'Pipeline Comercial',
  leads: 'Base de Leads',
  atividades: 'Agenda de Atividades',
};

function createLocalStorageStore<T>(key: string, fallback: T) {
  let cachedRaw: string | null = null;
  let cachedValue: T = fallback;
  const listeners = new Set<() => void>();

  const getSnapshot = (): T => {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        const parsed = JSON.parse(raw);
        if (Array.isArray(fallback) && !Array.isArray(parsed)) {
          return fallback;
        }
        cachedValue = parsed as T;
      }
      return cachedValue;
    } catch {
      return fallback;
    }
  };

  const getServerSnapshot = (): T => fallback;

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  };

  const setValue = (updater: T | ((prev: T) => T)) => {
    const current = getSnapshot();
    const next =
      typeof updater === 'function'
        ? (updater as (prev: T) => T)(current)
        : updater;
    const serialized = JSON.stringify(next);
    cachedRaw = serialized;
    cachedValue = next;
    try {
      window.localStorage.setItem(key, serialized);
    } catch {
      // Ignora erro de quota
    }
    listeners.forEach((l) => l());
  };

  return { subscribe, getSnapshot, getServerSnapshot, setValue };
}

const leadsStore = createLocalStorageStore<Lead[]>(
  STORAGE_LEADS_KEY,
  INITIAL_LEADS
);
const activitiesStore = createLocalStorageStore<LeadActivity[]>(
  STORAGE_ACTIVITIES_KEY,
  INITIAL_ACTIVITIES
);

export function LeadFlowApp() {
  const router = useRouter();
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getSessionServerSnapshot
  );

  const localLeads = useSyncExternalStore(
    leadsStore.subscribe,
    leadsStore.getSnapshot,
    leadsStore.getServerSnapshot
  );
  const localActivities = useSyncExternalStore(
    activitiesStore.subscribe,
    activitiesStore.getSnapshot,
    activitiesStore.getServerSnapshot
  );

  const useSupabaseRemote = Boolean(
    session && !session.isDemo && session.accessToken
  );

  const [remoteLeads, setRemoteLeads] = useState<Lead[]>([]);
  const [remoteActivities, setRemoteActivities] = useState<LeadActivity[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);

  const [activeSection, setActiveSection] = useState<NavSection>('visao-geral');
  const [ownerFilter, setOwnerFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [pipelineFocusStage, setPipelineFocusStage] =
    useState<PipelineStage>('novo');
  const [leadsStageFilter, setLeadsStageFilter] = useState<
    PipelineStage | 'todos'
  >('todos');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [modalDefaultStage, setModalDefaultStage] =
    useState<PipelineStage>('novo');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Carrega dados do Supabase via rotas de API do servidor quando autenticado
  useEffect(() => {
    if (!useSupabaseRemote || !session?.id) return;
    let cancelled = false;

    fetchWorkspaceFromSupabase()
      .then((data) => {
        if (cancelled) return;
        setRemoteLeads(data.leads);
        setRemoteActivities(data.activities);
        setRemoteLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRemoteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [useSupabaseRemote, session?.id]);

  const leads = useSupabaseRemote ? remoteLeads : localLeads;
  const activities = useSupabaseRemote ? remoteActivities : localActivities;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  // Filtragem por carteira comercial e pesquisa global
  const visibleLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leads.filter((lead) => {
      if (ownerFilter !== 'todos' && lead.ownerId !== ownerFilter) return false;
      if (!q) return true;
      return (
        lead.company.toLowerCase().includes(q) ||
        lead.name.toLowerCase().includes(q) ||
        lead.segment.toLowerCase().includes(q) ||
        lead.city.toLowerCase().includes(q) ||
        lead.origin.toLowerCase().includes(q)
      );
    });
  }, [leads, ownerFilter, searchQuery]);

  const visibleActivities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activities.filter((act) => {
      if (ownerFilter !== 'todos' && act.ownerId !== ownerFilter) return false;
      if (!q) return true;
      const linked = leads.find((l) => l.id === act.leadId);
      return (
        act.title.toLowerCase().includes(q) ||
        act.description.toLowerCase().includes(q) ||
        (linked?.company.toLowerCase().includes(q) ?? false)
      );
    });
  }, [activities, ownerFilter, searchQuery, leads]);

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  const handleMoveLeadStage = async (
    leadId: string,
    newStage: PipelineStage
  ) => {
    const stageInfo = getStageInfo(newStage);
    const today = new Date().toISOString().slice(0, 10);
    const current = leads.find((l) => l.id === leadId);
    const nextProbability =
      newStage === 'fechado'
        ? 100
        : Math.max(current?.probability ?? 0, stageInfo.defaultProbability);

    if (useSupabaseRemote) {
      setRemoteLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                stage: newStage,
                probability: nextProbability,
                updatedAt: today,
              }
            : l
        )
      );
      try {
        await updateLeadInSupabase(leadId, {
          stage: newStage,
          probability: nextProbability,
        });
      } catch {
        showToast('Erro ao sincronizar etapa com o Supabase.');
        return;
      }
    } else {
      leadsStore.setValue((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                stage: newStage,
                probability: nextProbability,
                updatedAt: today,
              }
            : l
        )
      );
    }

    showToast(`Negócio movido para "${stageInfo.label}".`);
  };

  const handleUpdateNotes = async (leadId: string, notes: string) => {
    const today = new Date().toISOString().slice(0, 10);
    if (useSupabaseRemote) {
      setRemoteLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, notes, updatedAt: today } : l))
      );
      try {
        await updateLeadInSupabase(leadId, { notes });
      } catch {
        showToast('Erro ao salvar anotações no Supabase.');
      }
    } else {
      leadsStore.setValue((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, notes, updatedAt: today } : l))
      );
    }
  };

  const handleSaveLead = async (
    data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const today = new Date().toISOString().slice(0, 10);

    if (useSupabaseRemote && session) {
      try {
        if (existingId) {
          const updated = await updateLeadInSupabase(existingId, data);
          setRemoteLeads((prev) =>
            prev.map((l) => (l.id === existingId ? updated : l))
          );
          showToast(`Lead "${data.company}" atualizado.`);
        } else {
          const created = await createLeadInSupabase(data);
          setRemoteLeads((prev) => [created, ...prev]);
          setSelectedLeadId(created.id);
          showToast(`Lead "${data.company}" cadastrado com sucesso.`);
        }
      } catch {
        showToast('Erro ao salvar lead no Supabase.');
        return;
      }
    } else if (existingId) {
      leadsStore.setValue((prev) =>
        prev.map((l) =>
          l.id === existingId ? { ...l, ...data, updatedAt: today } : l
        )
      );
      showToast(`Lead "${data.company}" atualizado.`);
    } else {
      const newLead: Lead = {
        ...data,
        id: `ld-${Date.now()}`,
        createdAt: today,
        updatedAt: today,
      };
      leadsStore.setValue((prev) => [newLead, ...prev]);
      setSelectedLeadId(newLead.id);
      showToast(`Lead "${data.company}" cadastrado com sucesso.`);
    }

    setModalOpen(false);
    setEditingLead(null);
  };

  const handleDeleteLead = async (leadId: string) => {
    const target = leads.find((l) => l.id === leadId);
    if (useSupabaseRemote) {
      try {
        await deleteLeadInSupabase(leadId);
        setRemoteLeads((prev) => prev.filter((l) => l.id !== leadId));
        setRemoteActivities((prev) => prev.filter((a) => a.leadId !== leadId));
      } catch {
        showToast('Erro ao excluir lead no Supabase.');
        return;
      }
    } else {
      leadsStore.setValue((prev) => prev.filter((l) => l.id !== leadId));
      activitiesStore.setValue((prev) =>
        prev.filter((a) => a.leadId !== leadId)
      );
    }
    setSelectedLeadId(null);
    if (target) {
      showToast(`Lead "${target.company}" removido.`);
    }
  };

  const handleToggleActivity = async (activityId: string) => {
    const current = activities.find((a) => a.id === activityId);
    const nextCompleted = !(current?.completed ?? false);

    if (useSupabaseRemote) {
      setRemoteActivities((prev) =>
        prev.map((a) =>
          a.id === activityId ? { ...a, completed: nextCompleted } : a
        )
      );
      try {
        await toggleActivityInSupabase(activityId, nextCompleted);
      } catch {
        showToast('Erro ao atualizar atividade no Supabase.');
      }
    } else {
      activitiesStore.setValue((prev) =>
        prev.map((a) =>
          a.id === activityId ? { ...a, completed: nextCompleted } : a
        )
      );
    }
  };

  const handleAddActivity = async (
    activity: Omit<LeadActivity, 'id' | 'completed'>
  ) => {
    if (useSupabaseRemote && session) {
      try {
        const created = await createActivityInSupabase(activity);
        setRemoteActivities((prev) => [created, ...prev]);
        showToast('Follow-up adicionado à agenda.');
      } catch {
        showToast('Erro ao salvar atividade no Supabase.');
      }
    } else {
      const newActivity: LeadActivity = {
        ...activity,
        id: `act-${Date.now()}`,
        completed: false,
      };
      activitiesStore.setValue((prev) => [newActivity, ...prev]);
      showToast('Follow-up adicionado à agenda.');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (useSupabaseRemote) {
      try {
        await deleteActivityInSupabase(activityId);
        setRemoteActivities((prev) => prev.filter((a) => a.id !== activityId));
        showToast('Atividade removida.');
      } catch {
        showToast('Erro ao remover atividade no Supabase.');
      }
    } else {
      activitiesStore.setValue((prev) =>
        prev.filter((a) => a.id !== activityId)
      );
      showToast('Atividade removida.');
    }
  };

  const handleResetDemo = async () => {
    if (useSupabaseRemote && session) {
      setRemoteLoading(true);
      try {
        const seeded = await seedDemoWorkspaceInSupabase();
        setRemoteLeads(seeded.leads);
        setRemoteActivities(seeded.activities);
        showToast('Dados iniciais gravados no seu Supabase.');
      } catch {
        showToast('Erro ao popular dados no Supabase.');
      } finally {
        setRemoteLoading(false);
      }
    } else {
      leadsStore.setValue(INITIAL_LEADS);
      activitiesStore.setValue(INITIAL_ACTIVITIES);
      showToast('Dados de demonstração restaurados.');
    }
    setOwnerFilter('todos');
    setSearchQuery('');
    setSelectedLeadId(null);
  };

  const openNewLeadModal = (stage: PipelineStage = 'novo') => {
    setEditingLead(null);
    setModalDefaultStage(stage);
    setModalOpen(true);
  };

  const ownerLabel =
    ownerFilter === 'todos'
      ? 'Toda a Equipe'
      : getTeamMember(ownerFilter).name;

  const handleLogout = async () => {
    await logoutSession();
    setMobileMenuOpen(false);
    router.push('/login');
  };

  if (!session) {
    return <AuthScreen mode="login" />;
  }

  return (
    <div className="relative min-h-screen bg-[#0a0e1a] text-slate-100">
      {/* Camada atmosférica "Frozen Light" */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -left-24 h-[520px] w-[520px] rounded-full bg-[#7dd3fc]/[0.07] blur-[130px]" />
        <div className="absolute top-1/3 -right-32 h-[480px] w-[480px] rounded-full bg-[#c8a0f0]/[0.06] blur-[140px]" />
        <div className="absolute -bottom-48 left-1/3 h-[420px] w-[420px] rounded-full bg-[#7dd3fc]/[0.04] blur-[130px]" />
      </div>

      {/* Navegação Lateral */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={(section) => {
          setActiveSection(section);
          if (section === 'leads') setLeadsStageFilter('todos');
        }}
        ownerFilter={ownerFilter}
        onChangeOwnerFilter={setOwnerFilter}
        counts={{
          totalLeads: visibleLeads.length,
          openPipeline: visibleLeads.filter((l) => l.stage !== 'fechado').length,
          pendingActivities: visibleActivities.filter((a) => !a.completed)
            .length,
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onResetDemo={handleResetDemo}
        currentUser={session}
        onLogout={handleLogout}
      />

      {/* Área Principal */}
      <div className="relative z-10 flex min-h-screen flex-col lg:pl-64">
        {/* Top Bar Compacto (<= 15% altura mobile) */}
        <header className="glass-panel sticky top-0 z-20 border-x-0 border-t-0 border-b border-[#7dd3fc]/12">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            {/* Esquerda: Menu Mobile + Breadcrumb Contextual */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Abrir menu de navegação"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 hover:border-[#7dd3fc]/35 hover:text-[#7dd3fc] lg:hidden cursor-pointer shrink-0"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="font-display font-semibold text-slate-200 lg:hidden">
                  LeadFlow
                </span>
                <span className="text-slate-600 lg:hidden">/</span>
                <span className="truncate font-medium text-slate-100">
                  {SECTION_LABELS[activeSection]}
                </span>
                <span className="hidden sm:inline text-slate-600">/</span>
                <span className="hidden sm:inline truncate text-xs text-slate-400">
                  {ownerLabel}
                </span>
              </div>
            </div>

            {/* Direita: Busca Rápida (Desktop) + Ação Principal */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative hidden md:block w-64 lg:w-72">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar empresa, contato ou cidade..."
                  aria-label="Buscar leads"
                  className="glass-input w-full rounded-xl py-2 pl-9 pr-8 text-xs text-slate-100 placeholder:text-slate-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpar busca"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => openNewLeadModal('novo')}
                className="glass-btn-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Novo Lead</span>
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {/* Busca Mobile Inline */}
          <div className="mb-5 md:hidden">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar empresa, contato ou cidade..."
                aria-label="Buscar leads no celular"
                className="glass-input w-full rounded-xl py-2.5 pl-10 pr-9 text-sm text-slate-100 placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpar busca"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {remoteLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="glass-panel h-32 animate-pulse rounded-2xl p-5"
                />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeSection === 'visao-geral' && (
                  <OverviewView
                    leads={visibleLeads}
                    activities={visibleActivities}
                    onSelectLead={(id) => setSelectedLeadId(id)}
                    onToggleActivity={handleToggleActivity}
                    onNavigateToStage={(stage) => {
                      setPipelineFocusStage(stage);
                      setLeadsStageFilter(stage);
                      setActiveSection('pipeline');
                    }}
                    onNavigateToActivities={() =>
                      setActiveSection('atividades')
                    }
                  />
                )}

                {activeSection === 'pipeline' && (
                  <PipelineBoard
                    leads={visibleLeads}
                    initialFocusedStage={pipelineFocusStage}
                    onMoveLeadStage={handleMoveLeadStage}
                    onSelectLead={(id) => setSelectedLeadId(id)}
                    onNewLeadInStage={(stage) => openNewLeadModal(stage)}
                  />
                )}

                {activeSection === 'leads' && (
                  <LeadsTableView
                    leads={visibleLeads}
                    initialStageFilter={leadsStageFilter}
                    onSelectLead={(id) => setSelectedLeadId(id)}
                    onMoveLeadStage={handleMoveLeadStage}
                    onOpenNewLead={() => openNewLeadModal('novo')}
                    onClearGlobalSearch={() => setSearchQuery('')}
                  />
                )}

                {activeSection === 'atividades' && (
                  <ActivitiesView
                    activities={visibleActivities}
                    leads={leads}
                    onToggleActivity={handleToggleActivity}
                    onAddActivity={handleAddActivity}
                    onDeleteActivity={handleDeleteActivity}
                    onSelectLead={(id) => setSelectedLeadId(id)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Painel Lateral de Detalhes do Lead */}
      <LeadDetailDrawer
        lead={selectedLead}
        activities={activities}
        onClose={() => setSelectedLeadId(null)}
        onMoveStage={handleMoveLeadStage}
        onUpdateNotes={handleUpdateNotes}
        onEditLead={(lead) => {
          setEditingLead(lead);
          setModalDefaultStage(lead.stage);
          setModalOpen(true);
        }}
        onDeleteLead={handleDeleteLead}
        onToggleActivity={handleToggleActivity}
        onAddActivity={handleAddActivity}
      />

      {/* Modal de Cadastro / Edição de Lead */}
      <LeadFormModal
        open={modalOpen}
        editingLead={editingLead}
        defaultStage={modalDefaultStage}
        onClose={() => {
          setModalOpen(false);
          setEditingLead(null);
        }}
        onSave={handleSaveLead}
      />

      {/* Notificação Sutil em Vidro */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            role="status"
            aria-live="polite"
            className="glass-panel-elevated fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-medium text-slate-100"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7dd3fc]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
