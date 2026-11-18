'use client';

import {
  LayoutDashboard,
  Kanban,
  Users,
  CalendarCheck,
  X,
  RotateCcw,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { TEAM_MEMBERS } from '@/lib/leadflow-data';
import type { AuthUser } from '@/lib/leadflow-auth';
import { TeamAvatar } from './TeamAvatar';
import { cn } from '@/lib/utils';

export type NavSection = 'visao-geral' | 'pipeline' | 'leads' | 'atividades';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  ownerFilter: string;
  onChangeOwnerFilter: (ownerId: string) => void;
  counts: {
    totalLeads: number;
    openPipeline: number;
    pendingActivities: number;
  };
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onResetDemo: () => void;
  currentUser: AuthUser;
  onLogout: () => void;
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'pipeline', label: 'Pipeline', icon: Kanban },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'atividades', label: 'Atividades', icon: CalendarCheck },
];

export function Sidebar({
  activeSection,
  onSelectSection,
  ownerFilter,
  onChangeOwnerFilter,
  counts,
  mobileOpen,
  onCloseMobile,
  onResetDemo,
  currentUser,
  onLogout,
}: SidebarProps) {
  const matchedTeamMember = TEAM_MEMBERS.find((m) => m.id === currentUser.id);

  const getBadgeCount = (id: NavSection): number | null => {
    if (id === 'pipeline') return counts.openPipeline;
    if (id === 'leads') return counts.totalLeads;
    if (id === 'atividades') return counts.pendingActivities;
    return null;
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between p-5">
      <div className="space-y-8">
        {/* Brand Wordmark */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onSelectSection('visao-geral');
              onCloseMobile();
            }}
            className="group flex items-center gap-3 text-left cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#7dd3fc]/30 bg-[#7dd3fc]/10 text-[#7dd3fc] transition-all duration-200 group-hover:border-[#7dd3fc]/60 group-hover:shadow-[0_0_24px_rgba(125,211,252,0.2)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight text-slate-50 whitespace-nowrap">
              LeadFlow
            </span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Fechar menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:border-[#7dd3fc]/30 hover:text-slate-100 lg:hidden cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navegação Principal */}
        <nav aria-label="Navegação principal" className="space-y-1.5">
          <p className="px-3 pb-1 text-xs font-medium text-slate-400">
            Navegação
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const count = getBadgeCount(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap',
                  isActive
                    ? 'border border-[#7dd3fc]/30 bg-[#7dd3fc]/12 text-[#e0f2fe] shadow-[0_0_24px_rgba(125,211,252,0.08)]'
                    : 'border border-transparent text-slate-300 hover:border-[#7dd3fc]/15 hover:bg-white/[0.04] hover:text-slate-50'
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-[#7dd3fc]' : 'text-slate-400'
                    )}
                  />
                  <span>{item.label}</span>
                </span>
                {count !== null && (
                  <span
                    className={cn(
                      'font-mono text-xs tabular-nums',
                      isActive ? 'text-[#7dd3fc]' : 'text-slate-400'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Filtro de Equipe Comercial */}
        <div className="space-y-2 border-t border-[#7dd3fc]/10 pt-5">
          <p className="px-3 pb-1 text-xs font-medium text-slate-400">
            Carteira Comercial
          </p>
          <button
            type="button"
            onClick={() => {
              onChangeOwnerFilter('todos');
              onCloseMobile();
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-sm transition-all duration-150 cursor-pointer whitespace-nowrap',
              ownerFilter === 'todos'
                ? 'border border-[#c8a0f0]/30 bg-[#c8a0f0]/10 text-slate-100'
                : 'border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
            )}
          >
            <span>Toda a Equipe</span>
            <span className="font-mono text-xs tabular-nums text-slate-400">
              {TEAM_MEMBERS.length}
            </span>
          </button>

          <div className="space-y-1">
            {TEAM_MEMBERS.map((member) => {
              const selected = ownerFilter === member.id;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    onChangeOwnerFilter(member.id);
                    onCloseMobile();
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-all duration-150 cursor-pointer',
                    selected
                      ? 'border border-[#7dd3fc]/25 bg-[#7dd3fc]/10 text-slate-100'
                      : 'border border-transparent text-slate-300 hover:bg-white/[0.04] hover:text-slate-50'
                  )}
                >
                  <TeamAvatar member={member} size="xs" />
                  <span className="truncate">{member.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rodapé do Usuário */}
      <div className="space-y-2.5 border-t border-[#7dd3fc]/10 pt-4">
        <div className="flex items-center gap-3 px-1">
          {matchedTeamMember ? (
            <TeamAvatar member={matchedTeamMember} size="md" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#7dd3fc]/30 bg-[#7dd3fc]/12 font-display text-xs font-semibold text-[#7dd3fc]">
              {currentUser.initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-100">
              {currentUser.name}
            </p>
            <p className="truncate text-xs text-slate-400">
              {currentUser.role}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetDemo}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-[#7dd3fc]/25 hover:text-slate-200 cursor-pointer whitespace-nowrap"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Restaurar dados iniciais</span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200 cursor-pointer whitespace-nowrap"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sair da conta</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Glass Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col glass-panel border-r border-[#7dd3fc]/10 border-y-0 border-l-0">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={onCloseMobile}
            aria-hidden="true"
            className="fixed inset-0 bg-[#050811]/75 backdrop-blur-sm cursor-pointer"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] glass-panel-elevated border-r border-[#7dd3fc]/15 border-y-0 border-l-0">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
