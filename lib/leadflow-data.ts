import type { StaticImageData } from 'next/image';
import avatarThiago from '@/src/assets/images/avatar_thiago_mendes_1794964999022.jpg';
import avatarCamila from '@/src/assets/images/avatar_camila_vasconcelos_1794964999261.jpg';
import avatarRafael from '@/src/assets/images/avatar_rafael_nogueira_1794964999403.jpg';

export type PipelineStage =
  | 'novo'
  | 'qualificacao'
  | 'proposta'
  | 'negociacao'
  | 'fechado';

export type LeadOrigin =
  | 'Inbound / Site'
  | 'LinkedIn'
  | 'Indicação'
  | 'Outbound'
  | 'Evento';

export type LeadPriority = 'Alta' | 'Média' | 'Normal';

export type ActivityType = 'Ligação' | 'Reunião' | 'E-mail' | 'Proposta' | 'Nota';

export interface TeamMember {
  id: string;
  name: string;
  shortName: string;
  role: string;
  email: string;
  avatar: StaticImageData;
  initials: string;
}

export interface Lead {
  id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  segment: string;
  origin: LeadOrigin;
  stage: PipelineStage;
  priority: LeadPriority;
  value: number;
  probability: number;
  ownerId: string;
  nextAction: string;
  nextActionDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: ActivityType;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  ownerId: string;
  completed: boolean;
}

export interface StageDefinition {
  id: PipelineStage;
  label: string;
  shortLabel: string;
  defaultProbability: number;
  accentColor: string;
  description: string;
}

export const PIPELINE_STAGES: StageDefinition[] = [
  {
    id: 'novo',
    label: 'Novo Lead',
    shortLabel: 'Novo',
    defaultProbability: 15,
    accentColor: '#7dd3fc',
    description: 'Contatos recém-captados aguardando primeiro contato.',
  },
  {
    id: 'qualificacao',
    label: 'Qualificação',
    shortLabel: 'Qualificação',
    defaultProbability: 35,
    accentColor: '#93c5fd',
    description: 'Descoberta de necessidades, orçamento e decisores.',
  },
  {
    id: 'proposta',
    label: 'Proposta Enviada',
    shortLabel: 'Proposta',
    defaultProbability: 60,
    accentColor: '#c8a0f0',
    description: 'Escopo comercial e valores apresentados ao cliente.',
  },
  {
    id: 'negociacao',
    label: 'Negociação',
    shortLabel: 'Negociação',
    defaultProbability: 85,
    accentColor: '#a78bfa',
    description: 'Alinhamento jurídico, prazos e condições finais.',
  },
  {
    id: 'fechado',
    label: 'Fechado Ganho',
    shortLabel: 'Fechado',
    defaultProbability: 100,
    accentColor: '#6ee7b7',
    description: 'Contrato assinado e conta pronta para implantação.',
  },
];

export const LEAD_ORIGINS: LeadOrigin[] = [
  'Inbound / Site',
  'LinkedIn',
  'Indicação',
  'Outbound',
  'Evento',
];

export const LEAD_PRIORITIES: LeadPriority[] = ['Alta', 'Média', 'Normal'];

export const ACTIVITY_TYPES: ActivityType[] = [
  'Ligação',
  'Reunião',
  'E-mail',
  'Proposta',
  'Nota',
];

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'tm-thiago',
    name: 'Thiago Mendes',
    shortName: 'Thiago M.',
    role: 'Diretor Comercial',
    email: 'thiago.mendes@leadflow.com.br',
    avatar: avatarThiago,
    initials: 'TM',
  },
  {
    id: 'tm-camila',
    name: 'Camila Vasconcelos',
    shortName: 'Camila V.',
    role: 'Executiva Enterprise',
    email: 'camila.v@leadflow.com.br',
    avatar: avatarCamila,
    initials: 'CV',
  },
  {
    id: 'tm-rafael',
    name: 'Rafael Nogueira',
    shortName: 'Rafael N.',
    role: 'Especialista SDR',
    email: 'rafael.n@leadflow.com.br',
    avatar: avatarRafael,
    initials: 'RN',
  },
];

export const MONTHLY_REVENUE_SERIES = [
  { month: 'Jun', revenue: 142000, leads: 34 },
  { month: 'Jul', revenue: 168500, leads: 41 },
  { month: 'Ago', revenue: 159000, leads: 38 },
  { month: 'Set', revenue: 196000, leads: 49 },
  { month: 'Out', revenue: 224500, leads: 56 },
  { month: 'Nov', revenue: 263000, leads: 64 },
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'ld-101',
    name: 'Mariana Albuquerque',
    role: 'Head de Operações',
    company: 'Veloce Logística Integrada',
    email: 'mariana.a@velocelog.com.br',
    phone: '(11) 98422-7109',
    city: 'São Paulo, SP',
    segment: 'Logística B2B',
    origin: 'Indicação',
    stage: 'negociacao',
    priority: 'Alta',
    value: 94000,
    probability: 85,
    ownerId: 'tm-camila',
    nextAction: 'Revisar cláusula de SLA com jurídico',
    nextActionDate: '2026-11-18',
    notes:
      'Operação com 18 centros de distribuição. Diretoria aprovou orçamento anual; aguardando apenas parecer final do jurídico sobre SLA de integração via API.',
    createdAt: '2026-10-28',
    updatedAt: '2026-11-17',
  },
  {
    id: 'ld-102',
    name: 'Eduardo Cavalcanti',
    role: 'Diretor de Tecnologia',
    company: 'Núcleo Pay Fintech',
    email: 'eduardo@nucleopay.com.br',
    phone: '(11) 99103-4420',
    city: 'São Paulo, SP',
    segment: 'Fintech',
    origin: 'Inbound / Site',
    stage: 'proposta',
    priority: 'Alta',
    value: 78500,
    probability: 65,
    ownerId: 'tm-thiago',
    nextAction: 'Apresentar comparativo de ROI ao CFO',
    nextActionDate: '2026-11-19',
    notes:
      'Buscam substituir CRM legado que não integra com WhatsApp oficial e automação de cobrança. Demonstração técnica teve excelente recepção.',
    createdAt: '2026-11-02',
    updatedAt: '2026-11-16',
  },
  {
    id: 'ld-103',
    name: 'Fernanda Bittencourt',
    role: 'Gerente de Expansão',
    company: 'Clínica Vida Plena',
    email: 'fernanda.b@vidaplena.med.br',
    phone: '(41) 99814-2055',
    city: 'Curitiba, PR',
    segment: 'Saúde Digital',
    origin: 'LinkedIn',
    stage: 'qualificacao',
    priority: 'Média',
    value: 42000,
    probability: 40,
    ownerId: 'tm-rafael',
    nextAction: 'Reunião de diagnóstico com equipe de atendimento',
    nextActionDate: '2026-11-18',
    notes:
      'Rede com 9 unidades no Paraná. Precisa centralizar agendamentos particulares vindos de campanhas pagas.',
    createdAt: '2026-11-08',
    updatedAt: '2026-11-17',
  },
  {
    id: 'ld-104',
    name: 'Gustavo Henrique Prado',
    role: 'VP Comercial',
    company: 'AçoSul Industrial',
    email: 'g.prado@acosul.ind.br',
    phone: '(51) 98211-9034',
    city: 'Porto Alegre, RS',
    segment: 'Indústria',
    origin: 'Evento',
    stage: 'fechado',
    priority: 'Alta',
    value: 118000,
    probability: 100,
    ownerId: 'tm-thiago',
    nextAction: 'Kickoff de onboarding com CS',
    nextActionDate: '2026-11-20',
    notes:
      'Contrato assinado para 45 licenças comerciais e módulo de previsão de faturamento trimestral.',
    createdAt: '2026-10-14',
    updatedAt: '2026-11-15',
  },
  {
    id: 'ld-105',
    name: 'Beatriz Monteiro',
    role: 'CEO & Co-fundadora',
    company: 'Orbita Cloud SaaS',
    email: 'beatriz@orbitacloud.io',
    phone: '(48) 99650-1182',
    city: 'Florianópolis, SC',
    segment: 'SaaS B2B',
    origin: 'Indicação',
    stage: 'proposta',
    priority: 'Alta',
    value: 54000,
    probability: 60,
    ownerId: 'tm-camila',
    nextAction: 'Validar desconto para pagamento anual',
    nextActionDate: '2026-11-18',
    notes:
      'Startup em fase Series A expandindo time de SDRs de 6 para 18 pessoas no próximo trimestre.',
    createdAt: '2026-11-05',
    updatedAt: '2026-11-17',
  },
  {
    id: 'ld-106',
    name: 'Lucas Andrade Silva',
    role: 'Coordenador de Marketing',
    company: 'Grupo Horizonte Varejo',
    email: 'lucas.andrade@horizontevarejo.com.br',
    phone: '(31) 99340-6781',
    city: 'Belo Horizonte, MG',
    segment: 'Varejo Omnichannel',
    origin: 'Inbound / Site',
    stage: 'novo',
    priority: 'Média',
    value: 31500,
    probability: 15,
    ownerId: 'tm-rafael',
    nextAction: 'Realizar primeira ligação de qualificação',
    nextActionDate: '2026-11-17',
    notes:
      'Solicitou demonstração pelo formulário principal após baixar material sobre automação de funil B2B.',
    createdAt: '2026-11-16',
    updatedAt: '2026-11-17',
  },
  {
    id: 'ld-107',
    name: 'Patrícia Peixoto',
    role: 'Diretora de Parcerias',
    company: 'Conecta Energia Solar',
    email: 'patricia@conectasolar.com.br',
    phone: '(81) 98790-3321',
    city: 'Recife, PE',
    segment: 'Energia Limpa',
    origin: 'Outbound',
    stage: 'qualificacao',
    priority: 'Alta',
    value: 67000,
    probability: 35,
    ownerId: 'tm-camila',
    nextAction: 'Enviar gravação da demo e estudo de caso',
    nextActionDate: '2026-11-20',
    notes:
      'Atendem integradores em todo o Nordeste. Alto volume de orçamentos diários que hoje se perdem em planilhas.',
    createdAt: '2026-11-10',
    updatedAt: '2026-11-16',
  },
  {
    id: 'ld-108',
    name: 'Rodrigo Salles',
    role: 'Sócio-Diretor',
    company: 'Salles & Moura Advocacia',
    email: 'rodrigo@sallesmoura.adv.br',
    phone: '(21) 99412-5590',
    city: 'Rio de Janeiro, RJ',
    segment: 'Serviços Jurídicos',
    origin: 'LinkedIn',
    stage: 'novo',
    priority: 'Normal',
    value: 24000,
    probability: 15,
    ownerId: 'tm-rafael',
    nextAction: 'Enviar e-mail de apresentação personalizado',
    nextActionDate: '2026-11-19',
    notes:
      'Escritório corporativo buscando estruturar prospecção ativa para contratos de compliance empresarial.',
    createdAt: '2026-11-15',
    updatedAt: '2026-11-16',
  },
  {
    id: 'ld-109',
    name: 'Juliana Ribeiro Costa',
    role: 'Gerente Nacional de Vendas',
    company: 'BioFarma Distribuidora',
    email: 'juliana.costa@biofarmadist.com.br',
    phone: '(19) 99744-8820',
    city: 'Campinas, SP',
    segment: 'Farmacêutico',
    origin: 'Evento',
    stage: 'negociacao',
    priority: 'Alta',
    value: 105000,
    probability: 85,
    ownerId: 'tm-thiago',
    nextAction: 'Fechar cronograma de migração de dados',
    nextActionDate: '2026-11-18',
    notes:
      'Proposta comercial validada pela diretoria. Falta definir janela de importação da base histórica de 12 mil clientes.',
    createdAt: '2026-10-22',
    updatedAt: '2026-11-17',
  },
  {
    id: 'ld-110',
    name: 'Marcelo Tavares',
    role: 'CFO',
    company: 'Atlas Construtech',
    email: 'marcelo.tavares@atlasconstrutech.com.br',
    phone: '(11) 98109-4412',
    city: 'São Paulo, SP',
    segment: 'Construção Civil',
    origin: 'Indicação',
    stage: 'fechado',
    priority: 'Alta',
    value: 89000,
    probability: 100,
    ownerId: 'tm-camila',
    nextAction: 'Liberar acessos administrativos da conta',
    nextActionDate: '2026-11-18',
    notes:
      'Implantação prioritária para equipe de vendas de lançamentos corporativos em SP e Campinas.',
    createdAt: '2026-10-10',
    updatedAt: '2026-11-14',
  },
  {
    id: 'ld-111',
    name: 'Camila Rezende',
    role: 'Head de Growth',
    company: 'EduPrime Corporativa',
    email: 'camila.rezende@eduprime.com.br',
    phone: '(31) 98845-1204',
    city: 'Belo Horizonte, MG',
    segment: 'EdTech B2B',
    origin: 'Inbound / Site',
    stage: 'proposta',
    priority: 'Média',
    value: 48000,
    probability: 60,
    ownerId: 'tm-rafael',
    nextAction: 'Acompanhar retorno sobre proposta enviada',
    nextActionDate: '2026-11-21',
    notes:
      'Interesse forte em pontuação automática de leads e distribuição por rodízio entre consultores.',
    createdAt: '2026-11-04',
    updatedAt: '2026-11-16',
  },
  {
    id: 'ld-112',
    name: 'Henrique Vasques',
    role: 'Gerente de TI',
    company: 'Porto Seguro Agro',
    email: 'henrique.v@agroporto.com.br',
    phone: '(62) 99231-7098',
    city: 'Goiânia, GO',
    segment: 'Agronegócio',
    origin: 'Outbound',
    stage: 'fechado',
    priority: 'Média',
    value: 56000,
    probability: 100,
    ownerId: 'tm-thiago',
    nextAction: 'Agendar treinamento da equipe regional',
    nextActionDate: '2026-11-22',
    notes:
      'Fechado plano anual com integração nativa ao ERP agrícola da empresa.',
    createdAt: '2026-10-18',
    updatedAt: '2026-11-12',
  },
  {
    id: 'ld-113',
    name: 'Renata Pacheco',
    role: 'Diretora de Receita',
    company: 'Pulse Pagamentos',
    email: 'renata@pulsepag.com.br',
    phone: '(11) 99512-0301',
    city: 'Barueri, SP',
    segment: 'Fintech',
    origin: 'LinkedIn',
    stage: 'novo',
    priority: 'Alta',
    value: 72000,
    probability: 20,
    ownerId: 'tm-camila',
    nextAction: 'Conectar e agendar call exploratória de 20 min',
    nextActionDate: '2026-11-18',
    notes:
      'Respondeu positivamente à abordagem sobre consolidação de pipeline multi-squads.',
    createdAt: '2026-11-17',
    updatedAt: '2026-11-17',
  },
  {
    id: 'ld-114',
    name: 'André Felipe Lemos',
    role: 'Gerente Comercial',
    company: 'Krono Automação',
    email: 'andre@kronoautomacao.com.br',
    phone: '(47) 99128-6433',
    city: 'Joinville, SC',
    segment: 'Automação Industrial',
    origin: 'Evento',
    stage: 'qualificacao',
    priority: 'Normal',
    value: 36500,
    probability: 35,
    ownerId: 'tm-rafael',
    nextAction: 'Mapear processo atual de follow-up de cotações',
    nextActionDate: '2026-11-21',
    notes:
      'Conversa inicial excelente durante feira industrial em Joinville. Ciclo médio de venda de 45 dias.',
    createdAt: '2026-11-11',
    updatedAt: '2026-11-15',
  },
];

export const INITIAL_ACTIVITIES: LeadActivity[] = [
  {
    id: 'act-1',
    leadId: 'ld-101',
    type: 'Reunião',
    title: 'Alinhamento jurídico de SLA — Veloce Logística',
    description: 'Revisar minuta final com time jurídico e confirmar assinatura eletrônica.',
    dueDate: '2026-11-18',
    dueTime: '10:30',
    ownerId: 'tm-camila',
    completed: false,
  },
  {
    id: 'act-2',
    leadId: 'ld-106',
    type: 'Ligação',
    title: 'Primeiro contato SDR — Grupo Horizonte Varejo',
    description: 'Qualificar volume mensal de leads e ferramentas atuais de atendimento.',
    dueDate: '2026-11-17',
    dueTime: '15:00',
    ownerId: 'tm-rafael',
    completed: false,
  },
  {
    id: 'act-3',
    leadId: 'ld-102',
    type: 'Proposta',
    title: 'Apresentação de ROI para CFO — Núcleo Pay',
    description: 'Detalhar economia operacional e redução no tempo de resposta comercial.',
    dueDate: '2026-11-19',
    dueTime: '14:00',
    ownerId: 'tm-thiago',
    completed: false,
  },
  {
    id: 'act-4',
    leadId: 'ld-109',
    type: 'Reunião',
    title: 'Definir cronograma de migração — BioFarma',
    description: 'Alinhar importação de 12 mil registros com equipe técnica do cliente.',
    dueDate: '2026-11-18',
    dueTime: '16:00',
    ownerId: 'tm-thiago',
    completed: false,
  },
  {
    id: 'act-5',
    leadId: 'ld-105',
    type: 'E-mail',
    title: 'Enviar condição comercial anual — Orbita Cloud',
    description: 'Proposta atualizada com 12% de desconto para faturamento anual.',
    dueDate: '2026-11-18',
    dueTime: '09:30',
    ownerId: 'tm-camila',
    completed: false,
  },
  {
    id: 'act-6',
    leadId: 'ld-113',
    type: 'Ligação',
    title: 'Call exploratória — Pulse Pagamentos',
    description: 'Entender metas de conversão Q1 2027 com Renata Pacheco.',
    dueDate: '2026-11-18',
    dueTime: '11:30',
    ownerId: 'tm-camila',
    completed: false,
  },
  {
    id: 'act-7',
    leadId: 'ld-104',
    type: 'Proposta',
    title: 'Contrato assinado — AçoSul Industrial',
    description: 'Recebida assinatura digital de Gustavo Prado. Conta encaminhada para CS.',
    dueDate: '2026-11-15',
    dueTime: '17:20',
    ownerId: 'tm-thiago',
    completed: true,
  },
  {
    id: 'act-8',
    leadId: 'ld-103',
    type: 'E-mail',
    title: 'Convite de diagnóstico enviado — Clínica Vida Plena',
    description: 'Enviada pauta da reunião e casos do setor de saúde.',
    dueDate: '2026-11-16',
    dueTime: '14:15',
    ownerId: 'tm-rafael',
    completed: true,
  },
  {
    id: 'act-9',
    leadId: 'ld-110',
    type: 'Nota',
    title: 'Onboarding prioritário confirmado — Atlas Construtech',
    description: 'Time de implantação já recebeu credenciais de acesso inicial.',
    dueDate: '2026-11-14',
    dueTime: '11:00',
    ownerId: 'tm-camila',
    completed: true,
  },
];

export function getStageInfo(stageId: PipelineStage): StageDefinition {
  return (
    PIPELINE_STAGES.find((s) => s.id === stageId) ?? PIPELINE_STAGES[0]
  );
}

export function getTeamMember(ownerId: string): TeamMember {
  return TEAM_MEMBERS.find((m) => m.id === ownerId) ?? TEAM_MEMBERS[0];
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatBRLFull(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatShortDateBR(dateStr: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ];
  const monthIdx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
  return `${parts[2]} ${months[monthIdx]}`;
}
