import { Database } from './Database';

/**
 * Repositório para gerenciar o estado das notificações enviadas,
 * garantindo que os lembretes não sejam enviados mais de uma vez.
 */
export class NotificationRepository {
    private db = Database.getInstance();

    /**
     * Registra que uma notificação de um tipo específico foi enviada para um evento.
     * @param eventId O ID do evento do Google Calendar.
     * @param notificationType O tipo de notificação (ex: '60min', '15min').
     * @returns {boolean} True se o registro foi criado com sucesso.
     */
    public add(eventId: string, notificationType: '60min' | '15min'): boolean {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO sent_notifications (event_id, notification_type)
                VALUES (?, ?)
            `);
            const result = stmt.run(eventId, notificationType);
            return result.changes > 0;
        } catch (error) {
            // Ignora erros de chave única, que indicam que a notificação já foi registrada
            // por um processo concorrente, o que é um comportamento esperado e seguro.
            if ((error as any).code !== 'SQLITE_CONSTRAINT_UNIQUE') {
                console.error('[NotificationRepository] Falha ao adicionar registro:', error);
                throw error;
            }
            return false;
        }
    }

    /**
     * Verifica se uma notificação de um tipo específico já foi enviada para um evento.
     * @param eventId O ID do evento do Google Calendar.
     * @param notificationType O tipo de notificação (ex: '60min', '15min').
     * @returns {boolean} True se a notificação já foi enviada.
     */
    public hasBeenSent(eventId: string, notificationType: '60min' | '15min'): boolean {
        const stmt = this.db.prepare(`
            SELECT 1 FROM sent_notifications
            WHERE event_id = ? AND notification_type = ?
            LIMIT 1
        `);
        const result = stmt.get(eventId, notificationType);
        return !!result;
    }
}
