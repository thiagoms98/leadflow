import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, type Content } from '@google/genai';

interface LeadContextItem {
  id: string;
  company: string;
  name: string;
  role: string;
  segment: string;
  origin: string;
  stage: string;
  priority: string;
  value: number;
  probability: number;
  nextAction: string;
  nextActionDate: string;
  notes: string;
}

interface ActivityContextItem {
  title: string;
  type: string;
  dueDate: string;
  dueTime: string;
  completed: boolean;
}

interface AssistantRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  leads?: LeadContextItem[];
  activities?: ActivityContextItem[];
  focusedLead?: LeadContextItem | null;
  userName?: string;
}

function buildSystemInstruction(body: AssistantRequestBody): string {
  const leads = body.leads ?? [];
  const activities = body.activities ?? [];
  const focusedLead = body.focusedLead ?? null;
  const userName = body.userName || 'Executivo Comercial';

  const openLeads = leads.filter((l) => l.stage !== 'fechado');
  const wonLeads = leads.filter((l) => l.stage === 'fechado');
  const totalOpen = openLeads.reduce((acc, l) => acc + (l.value || 0), 0);
  const totalWon = wonLeads.reduce((acc, l) => acc + (l.value || 0), 0);
  const weighted = openLeads.reduce(
    (acc, l) => acc + (l.value || 0) * ((l.probability || 0) / 100),
    0
  );

  const leadsSummary = leads
    .slice(0, 25)
    .map(
      (l) =>
        `- ${l.company} (Contato: ${l.name}, ${l.role}) | Etapa: ${l.stage} | Valor: R$ ${l.value.toLocaleString('pt-BR')} | Prob: ${l.probability}% | Prioridade: ${l.priority} | Origem: ${l.origin} | Próx. ação: ${l.nextAction} (${l.nextActionDate})${l.notes ? ` | Notas: ${l.notes}` : ''}`
    )
    .join('\n');

  const pendingActs = activities
    .filter((a) => !a.completed)
    .slice(0, 12)
    .map(
      (a) => `- [${a.type}] ${a.title} (${a.dueDate} às ${a.dueTime})`
    )
    .join('\n');

  const focusedSection = focusedLead
    ? `\nLEAD EM FOCO ATUAL:\nEmpresa: ${focusedLead.company}\nContato: ${focusedLead.name} (${focusedLead.role})\nSegmento: ${focusedLead.segment} | Origem: ${focusedLead.origin}\nEtapa: ${focusedLead.stage} | Prioridade: ${focusedLead.priority}\nValor: R$ ${focusedLead.value.toLocaleString('pt-BR')} | Probabilidade: ${focusedLead.probability}%\nPróxima ação: ${focusedLead.nextAction} (${focusedLead.nextActionDate})\nAnotações: ${focusedLead.notes || 'Sem anotações registradas.'}\n`
    : '';

  return `Você é o Assistente Comercial do LeadFlow, especialista sênior em vendas B2B consultivas, prospecção, qualificação (SPIN / MEDDIC), negociação e gestão de pipeline no mercado brasileiro.

Diretrizes obrigatórias:
- Responda sempre em Português do Brasil claro, objetivo, humano e prático.
- Use os dados reais do pipeline do usuário (${userName}) fornecidos abaixo; nunca invente empresas, valores ou reuniões que não existam no contexto.
- Quando redigir mensagens de WhatsApp, e-mails ou roteiros de ligação, entregue textos prontos para copiar e enviar, adaptados ao cargo, segmento e contexto do lead.
- Formate respostas com Markdown limpo (listas objetivas, negrito em nomes/valores importantes, blocos claros), sem enrolação.

RESUMO ATUAL DO PIPELINE:
- Total de leads visíveis: ${leads.length} (${openLeads.length} em aberto, ${wonLeads.length} fechados ganhos)
- Valor em aberto: R$ ${totalOpen.toLocaleString('pt-BR')}
- Previsão ponderada: R$ ${Math.round(weighted).toLocaleString('pt-BR')}
- Receita fechada: R$ ${totalWon.toLocaleString('pt-BR')}
${focusedSection}
LEADS NO PIPELINE:
${leadsSummary || 'Nenhum lead cadastrado ainda.'}

FOLLOW-UPS PENDENTES:
${pendingActs || 'Nenhum follow-up pendente.'}`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return NextResponse.json(
      {
        error:
          'Chave GEMINI_API_KEY não configurada. Adicione sua chave nas configurações de Secrets do ambiente.',
      },
      { status: 400 }
    );
  }

  try {
    const body = (await req.json()) as AssistantRequestBody;
    const rawMessages = body.messages ?? [];
    if (rawMessages.length === 0) {
      return NextResponse.json(
        { error: 'Envie uma mensagem para iniciar a conversa.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contents: Content[] = rawMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const systemInstruction = buildSystemInstruction(body);

    const stream = await ai.models.generateContentStream({
      model: 'gemini-4-hydrogen',
      contents,
      config: {
        systemInstruction,
      },
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text ?? '';
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : 'Erro durante a resposta do assistente.';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const rawMsg =
      err instanceof Error
        ? err.message
        : 'Erro ao consultar o assistente comercial.';
    const lower = rawMsg.toLowerCase();
    const status =
      lower.includes('api_key_invalid') || lower.includes('permission_denied')
        ? 403
        : lower.includes('resource_exhausted')
          ? 429
          : 500;
    const friendly =
      status === 403
        ? 'Chave da API Gemini inválida ou sem permissão. Verifique GEMINI_API_KEY em Settings > Secrets.'
        : status === 429
          ? 'Limite de requisições atingido no momento. Aguarde alguns instantes e tente novamente.'
          : rawMsg;

    return NextResponse.json({ error: friendly }, { status });
  }
}
