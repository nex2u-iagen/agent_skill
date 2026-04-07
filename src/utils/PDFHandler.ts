import fs from 'fs';
// @ts-ignore
import pdf from 'pdf-parse';

export class PDFHandler {
    /**
     * Extrai texto de um arquivo PDF.
     * @param filePath Caminho completo do arquivo PDF.
     */
    public static async extractText(filePath: string): Promise<string> {
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            
            if (!data.text || data.text.trim().length === 0) {
                return "O PDF parece estar vazio ou é baseado em imagem (OCR necessário).";
            }

            return data.text.trim();
        } catch (error: any) {
            console.error('[PDFHandler] Erro ao processar PDF:', error.message);
            throw new Error(`Falha ao ler o PDF: ${error.message}`);
        }
    }

    /**
     * Extrai texto diretamente de um Buffer.
     */
    public static async extractTextFromBuffer(buffer: Buffer): Promise<string> {
        try {
            const data = await pdf(buffer);
            return data.text.trim();
        } catch (error: any) {
            console.error('[PDFHandler] Erro ao processar Buffer de PDF:', error.message);
            throw new Error(`Falha ao ler o PDF (Buffer): ${error.message}`);
        }
    }
}
