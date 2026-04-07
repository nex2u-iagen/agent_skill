import { BaseTool, ToolDefinition } from './BaseTool';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

/**
 * Utilitário de Autenticação do Google
 * Centralizado e Protetivo buscando do .env por padrão.
 */
function getAuthClient() {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // MODO SEGURO: Usando Variáveis de Ambiente (.env)
    if (clientEmail && privateKey && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        return new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey
            },
            scopes: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly']
        });
    }

    // MODO FALLBACK: Arquivo JSON caso precise 
    const keyPath = path.join(process.cwd(), 'credentials.json');
    if (!fs.existsSync(keyPath)) {
        throw new Error('Nenhuma credencial Google válida.\nConfigurar GOOGLE_CLIENT_EMAIL e GOOGLE_PRIVATE_KEY no .env (Veja o manual).');
    }

    return new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly']
    });
}


// ==========================================================
// TOOL: Criar Evento
// ==========================================================
export class CriarEventoGoogleTool extends BaseTool {
    definition: ToolDefinition = {
        name: 'criar_evento_google',
        description: 'Cria um evento na agenda google com o título e data fornecidos.',
        parameters: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'O título do evento' },
                startDateTime: { type: 'string', description: 'A data e hora de início no formato ISO 8601 (ex: 2026-03-24T14:00:00-03:00)' },
                durationMinutes: { type: 'number', description: 'Duração estimada em minutos' }
            },
            required: ['title', 'startDateTime']
        }
    };

    async execute(args: { title: string, startDateTime: string, durationMinutes?: number }, metadata?: any): Promise<any> {
        const memberName = metadata?.member?.name;
        if (!['Mae', 'Pai'].includes(memberName)) {
            return 'Ação não permitida. Apenas "Mae" e "Pai" podem criar eventos.';
        }
        
        const auth = getAuthClient();
        const calendar = google.calendar({ version: 'v3', auth });
        
        const startTime = new Date(args.startDateTime);
        const endTime = new Date(startTime.getTime() + (args.durationMinutes || 60) * 60000);
        const calendarId = metadata?.google_calendar_id || process.env.GOOGLE_CALENDAR_ID || 'primary';

        try {
            const response = await calendar.events.insert({
                calendarId: calendarId,
                requestBody: {
                    summary: args.title,
                    start: { dateTime: startTime.toISOString() },
                    end: { dateTime: endTime.toISOString() },
                }
            });
            return `Evento criado com sucesso! Link: ${response.data.htmlLink}`;
        } catch (error: any) {
            console.error('[GoogleTools] Falha ao criar evento:', error.message);
            throw new Error(`Falha na API Google: ${error.message}`);
        }
    }
}

// ==========================================================
// TOOL: Listar Eventos
// ==========================================================
export class ListarEventosGoogleTool extends BaseTool {
    definition: ToolDefinition = {
        name: 'listar_eventos_google',
        description: 'Lista os próximos eventos da agenda do usuário para checar horários disponíveis.',
        parameters: {
            type: 'object',
            properties: {
                maxResults: { type: 'number', description: 'Quantidade máxima de eventos a recuperar' },
                timeMin: { type: 'string', description: 'Data/hora mínima no formato ISO 8601 para iniciar a busca' },
                timeMax: { type: 'string', description: 'Data/hora máxima no formato ISO 8601 para finalizar a busca' }
            }
        }
    };

    async execute(args: { maxResults?: number, timeMin?: string, timeMax?: string }, metadata?: any): Promise<any> {
        const auth = getAuthClient();
        const calendar = google.calendar({ version: 'v3', auth });
        const calendarId = metadata?.google_calendar_id || process.env.GOOGLE_CALENDAR_ID || 'primary';
        
        try {
            const response = await calendar.events.list({
                calendarId: calendarId,
                timeMin: args.timeMin || new Date().toISOString(),
                timeMax: args.timeMax,
                maxResults: args.maxResults || 5,
                singleEvents: true,
                orderBy: 'startTime',
            });

            const events = response.data.items;
            if (!events || events.length === 0) {
                return 'Nenhum evento futuro encontrado. A agenda parece livre.';
            }

            return events.map(e => ({
                id: e.id,
                titulo: e.summary,
                início: e.start?.dateTime || e.start?.date,
                fim: e.end?.dateTime || e.end?.date,
                link: e.htmlLink
            }));

        } catch (error: any) {
            console.error('[GoogleTools] Falha ao ler agenda:', error.message);
            throw new Error(`Falha na API Google: ${error.message}`);
        }
    }
}

// ==========================================================
// TOOL: Alterar  Evento
// ==========================================================
export class AlterarEventoGoogleTool extends BaseTool {
    definition: ToolDefinition = {
        name: 'alterar_evento_google',
        description: 'Altera o título ou horário de um evento existente na agenda.',
        parameters: {
            type: 'object',
            properties: {
                eventId: { type: 'string', description: 'ID do evento a ser alterado (obtido listando eventos)' },
                title: { type: 'string', description: 'O novo título do evento (opcional se não quiser mudar)' },
                startDateTime: { type: 'string', description: 'A nova data e hora de início ISO 8601 (opcional)' }
            },
            required: ['eventId']
        }
    };

    async execute(args: { eventId: string, title?: string, startDateTime?: string }, metadata?: any): Promise<any> {
        const memberName = metadata?.member?.name;
        if (!['Mae', 'Pai'].includes(memberName)) {
            return 'Ação não permitida. Apenas "Mae" e "Pai" podem alterar eventos.';
        }

        const auth = getAuthClient();
        const calendar = google.calendar({ version: 'v3', auth });
        const calendarId = metadata?.google_calendar_id || process.env.GOOGLE_CALENDAR_ID || 'primary';

        try {
            const event = await calendar.events.get({ calendarId, eventId: args.eventId });
            const requestBody: any = { ...event.data };
            
            if (args.title) requestBody.summary = args.title;
            if (args.startDateTime) {
                const startTime = new Date(args.startDateTime);
                const endTime = new Date(startTime.getTime() + 60 * 60000); // assume 1 hour
                requestBody.start = { dateTime: startTime.toISOString() };
                requestBody.end = { dateTime: endTime.toISOString() };
            }

            const response = await calendar.events.update({
                calendarId,
                eventId: args.eventId,
                requestBody
            });
            return `Evento alterado com sucesso! Link: ${response.data.htmlLink}`;
        } catch (error: any) {
            console.error('[GoogleTools] Falha ao alterar evento:', error.message);
            throw new Error(`Falha na API Google: ${error.message}`);
        }
    }
}

// ==========================================================
// TOOL: Excluir Evento
// ==========================================================
export class ExcluirEventoGoogleTool extends BaseTool {
    definition: ToolDefinition = {
        name: 'excluir_evento_google',
        description: 'Exclui (deleta) definitivamente um evento da agenda.',
        parameters: {
            type: 'object',
            properties: {
                eventId: { type: 'string', description: 'ID do evento a ser excluído (obtido listando eventos)' }
            },
            required: ['eventId']
        }
    };

    async execute(args: { eventId: string }, metadata?: any): Promise<any> {
        const isAdmin = metadata?.member?.is_admin === true;
        const memberName = metadata?.member?.name || 'Um usuário';

        const auth = getAuthClient();
        const calendar = google.calendar({ version: 'v3', auth });
        const calendarId = metadata?.google_calendar_id || process.env.GOOGLE_CALENDAR_ID || 'primary';

        // If the user is an admin, delete directly.
        if (isAdmin) {
            try {
                await calendar.events.delete({
                    calendarId: calendarId,
                    eventId: args.eventId
                });
                return 'Evento excluído com sucesso (requisição de administrador).';
            } catch (error: any) {
                console.error('[GoogleTools] Falha ao deletar evento (admin):', error.message);
                throw new Error(`Falha na API Google: ${error.message}`);
            }
        } else {
            // If not an admin, do not delete.
            // Instead, fetch the event details to make the confirmation request clearer.
            try {
                const event = await calendar.events.get({ calendarId, eventId: args.eventId });
                const summary = event.data.summary || 'sem título';
                // Return a specific, machine-readable instruction for the agent.
                return `CONFIRMAÇÃO NECESSÁRIA: O membro '${memberName}' solicitou a exclusão do evento '${summary}'. Um administrador precisa aprovar a exclusão do evento com ID: ${args.eventId}`;
            } catch (error: any) {
                 // Handle case where event ID is invalid
                if ((error as any).code === 404) {
                     return `Erro: O evento com ID ${args.eventId} não foi encontrado. Não é possível solicitar a exclusão.`;
                }
                console.error('[GoogleTools] Falha ao buscar evento para confirmação de exclusão:', error.message);
                throw new Error(`Falha na API Google ao buscar evento: ${error.message}`);
            }
        }
    }
}
