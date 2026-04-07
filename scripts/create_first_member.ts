import { MemberRepository } from '../src/persistence/MemberRepository';
import { Database } from '../src/persistence/Database';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function main() {
    try {
        console.log('--- Iniciando criação do primeiro membro ---');
        
        const memberRepo = new MemberRepository();
        
        // Verifica se já existe algum membro
        const members = memberRepo.list();
        if (members.length > 0) {
            console.log('Membros já existentes:', members);
        } else {
            const adminId = process.env.TELEGRAM_ALLOWED_USER_IDS?.split(',')[0] || '12345678';
            
            const newMember = {
                name: 'Administrador Inicial',
                role: 'Admin',
                telegram_id: adminId,
                is_admin: true
            };
            
            const id = memberRepo.create(newMember);
            console.log(`Membro administrador criado com sucesso! ID: ${id}`);
        }
    } catch (error) {
        console.error('Erro ao criar membro:', error);
    }
}

main();
