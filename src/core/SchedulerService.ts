import cron from 'node-cron';
import { Bot } from 'grammy';
import { MemberRepository, Member } from '../persistence/MemberRepository';
import { NotificationRepository } from '../persistence/NotificationRepository';
import { ListarEventosGoogleTool } from '../tools/GoogleTools';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

/**
 * Gerencia tarefas agendadas que o agente executa proativamente.
 */
export class SchedulerService {
    private bot: Bot;
    private memberRepo = new MemberRepository();
    private notificationRepo = new NotificationRepository();
    private listEventsTool = new ListarEventosGoogleTool();

    constructor(bot: Bot) {
        this.bot = bot;
    }
    
    /**
     * Inicia todos os trabalhos agendados.
     */
    public start(): void {
        console.log('[SchedulerService] Iniciando o agendador de tarefas...');

        // Tarefa 1: Verificar lembretes de eventos a cada minuto.
        cron.schedule('* * * * *', () => {
            this.checkEventReminders();
        });

        // Tarefa 2: Enviar resumo diário todos os dias às 20h.
        cron.schedule('0 20 * * *', () => {
            this.sendDailySummary();
        }, {
            timezone: "America/Sao_Paulo"
        });

        console.log('[SchedulerService] Agendador iniciado com sucesso.');
    }

    private async sendPushMessage(chatId: string, message: string): Promise<void> {
        try {
            await this.bot.api.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } catch (error: any) {
            console.error(`[Scheduler] Falha ao enviar mensagem para ${chatId}:`, error.message);
        }
    }

    /**
     * Verifica os próximos eventos e envia lembretes de 1h e 15min.
     */
    private async checkEventReminders(): Promise<void> {
        const members = this.memberRepo.list();
        const now = new Date();

        for (const member of members) {
            if (!member.google_calendar_id || !member.telegram_id) continue;
            
            try {
                // Busca eventos nos próximos 70 minutos para ter uma margem.
                const events = await this.listEventsTool.execute({ 
                    timeMin: now.toISOString(),
                    timeMax: new Date(now.getTime() + 70 * 60000).toISOString(),
                    maxResults: 10 
                }, { google_calendar_id: member.google_calendar_id });

                if (!Array.isArray(events)) continue;

                for (const event of events) {
                    if (!event.id || !event.início) continue;

                    const startTime = new Date(event.início);
                    const minutesUntilStart = (startTime.getTime() - now.getTime()) / 60000;

                    // Lembrete de 60 minutos
                    if (minutesUntilStart > 59 && minutesUntilStart <= 60) {
                        if (!this.notificationRepo.hasBeenSent(event.id, '60min')) {
                            const message = `*Lembrete (1h):* ${member.name}, seu compromisso "${event.titulo}" começa em aproximadamente 1 hora.`;
                            await this.sendPushMessage(member.telegram_id, message);
                            this.notificationRepo.add(event.id, '60min');
                        }
                    }

                    // Lembrete de 15 minutos
                    if (minutesUntilStart > 14 && minutesUntilStart <= 15) {
                        if (!this.notificationRepo.hasBeenSent(event.id, '15min')) {
                            const message = `*Lembrete (15min):* ${member.name}, seu compromisso "${event.titulo}" começa em 15 minutos.`;
                            await this.sendPushMessage(member.telegram_id, message);
                            this.notificationRepo.add(event.id, '15min');
                        }
                    }
                }
            } catch (error: any) {
                console.error(`[Scheduler] Erro ao verificar lembretes para ${member.name}:`, error.message);
            }
        }
    }

    /**
     * Envia um resumo da agenda do dia seguinte para "Pai" e "Mae".
     */
    private async sendDailySummary(): Promise<void> {
        console.log('[Scheduler] Executando: sendDailySummary');
        const members = this.memberRepo.list().filter(m => m.role === 'Pai' || m.role === 'Mamãe' || m.name === 'Pai' || m.name === 'Mae');
        const targetMembers = members.filter(m => m.telegram_id);

        if (targetMembers.length === 0) return;

        let summary = `*Resumo da Agenda - ${format(addDays(new Date(), 1), 'dd/MM/yyyy')}*\n\n`;
        let hasEvents = false;

        const tomorrowStart = startOfDay(addDays(new Date(), 1)).toISOString();
        const tomorrowEnd = endOfDay(addDays(new Date(), 1)).toISOString();

        for (const member of members) {
             if (!member.google_calendar_id) continue;

             try {
                const events = await this.listEventsTool.execute({
                    timeMin: tomorrowStart,
                    timeMax: tomorrowEnd,
                    maxResults: 20
                }, { google_calendar_id: member.google_calendar_id });

                if (Array.isArray(events) && events.length > 0) {
                    hasEvents = true;
                    summary += `*${member.name}:*\n`;
                    events.forEach(e => {
                        const eventTime = format(new Date(e.início), 'HH:mm');
                        summary += `- ${eventTime}: ${e.titulo}\n`;
                    });
                    summary += `\n`;
                }
             } catch (error: any) {
                 console.error(`[Scheduler] Erro ao buscar agenda de ${member.name} para resumo:`, error.message);
                 summary += `*${member.name}:* (Falha ao buscar agenda)\n\n`;
             }
        }

        if (!hasEvents) {
            summary += "_Nenhum compromisso agendado para amanhã._";
        }

        for (const target of targetMembers) {
            await this.sendPushMessage(target.telegram_id!, summary);
        }
    }
}
