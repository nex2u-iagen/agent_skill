import pdfplumber
import re
import json
import os

def extract_pdf_data(pdf_path):
    text = ""
    try:
        if pdf_path.lower().endswith('.txt'):
            with open(pdf_path, 'r', encoding='utf-8') as f:
                text = f.read()
        else:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
    except Exception as e:
        return {"error": f"Erro ao extrair texto do documento: {e}"}

    data = {
        "tipo": "Não identificado",
        "emissor": "Não identificado",
        "data": "Não identificada",
        "valor": "Não identificado",
        "texto_completo": text
    }

    # Detectar Tipo de Nota (Entrada/Saída)
    # Tentar detectar frases mais definitivas primeiro
    if re.search(r"nota fiscal de venda|nf-e de venda|cupom fiscal de venda", text, re.IGNORECASE):
        data["tipo"] = "Saída"
    elif re.search(r"nota fiscal de compra|nf-e de entrada|recibo de compra", text, re.IGNORECASE):
        data["tipo"] = "Entrada"
    # Adicionar verificação para "Venda" como indicação de Saída, se não definido antes
    elif re.search(r"\bVenda\b", text, re.IGNORECASE): # Palavra "Venda" isolada
        data["tipo"] = "Saída"
    # Fallback para palavras-chave mais genéricas se nada foi encontrado ainda
    else:
        entrada_keywords = re.compile(r"compra|recebimento|entrada|remessa para recebimento|devolução de venda", re.IGNORECASE)
        saida_keywords = re.compile(r"saída|prestação de serviço|remessa para cliente|devolução de compra", re.IGNORECASE) # Remover "venda" daqui para evitar conflito

        if entrada_keywords.search(text):
            data["tipo"] = "Entrada"
        elif saida_keywords.search(text):
            data["tipo"] = "Saída"

    # Extrair Emissor (tentativa de encontrar nomes/empresas próximos a termos como 'Remetente', 'Emitente', 'CNPJ')
    # Uma abordagem mais sofisticada pode ser necessária aqui, talvez com NLP ou uma lista de CNPJs
    emissor_patterns = [
        re.compile(r"(?:Emitente|Remetente|Prestador):\s*([^\n]+)", re.IGNORECASE),
        re.compile(r"Razão Social:\s*([^\n]+)", re.IGNORECASE),
        re.compile(r"Nome:\s*([^\n]+)", re.IGNORECASE),
    ]
    for pattern in emissor_patterns:
        match = pattern.search(text)
        if match:
            data["emissor"] = match.group(1).strip()
            # Tentar limpar o nome do emissor, removendo CNPJ/CPF se estiverem na mesma linha
            cnpj_cpf_pattern = re.compile(r"\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}|\d{3}\.\d{3}\.\d{3}\-\d{2}")
            data["emissor"] = cnpj_cpf_pattern.sub("", data["emissor"]).strip()
            break


    # Extrair Data (formatos comuns como DD/MM/AAAA, AAAA-MM-DD, DD de Mes de AAAA)
    date_patterns = [
        re.compile(r"\b(\d{2}/\d{2}/\d{4})\b"),  # DD/MM/AAAA
        re.compile(r"\b(\d{4}-\d{2}-\d{2})\b"),  # AAAA-MM-DD
        re.compile(r"\b(\d{1,2}\s(?:de\s)?(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s(?:de\s)?\d{4})\b", re.IGNORECASE) # DD de Mês de AAAA
    ]
    for pattern in date_patterns:
        match = pattern.search(text)
        if match:
            data["data"] = match.group(1).strip()
            break

    # Extrair Valor (padrões para R$ X.XXX,XX ou R$ X,XXX.XX)
    valor_patterns = [
        re.compile(r"(?:Total|Valor Total|Total Geral|Valor a Pagar|Valor Líquido):\s*R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d{1,3}(?:,\d{3})*(?:\.\d{2}))", re.IGNORECASE),
        re.compile(r"R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d{1,3}(?:,\d{3})*(?:\.\d{2}))") # Padrão genérico de valor com R$
    ]
    for pattern in valor_patterns:
        matches = pattern.findall(text)
        if matches:
            # Pega o último valor encontrado, que geralmente é o total em documentos fiscais
            data["valor"] = matches[-1].strip()
            break

    return data

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        pdf_file_path = sys.argv[1]
        if os.path.exists(pdf_file_path):
            extracted_data = extract_pdf_data(pdf_file_path)
            print(json.dumps(extracted_data, ensure_ascii=False, indent=4))
        else:
            print(json.dumps({"error": f"Arquivo PDF não encontrado: {pdf_file_path}"}, ensure_ascii=False, indent=4))
    else:
        print(json.dumps({"error": "Nenhum caminho de arquivo PDF fornecido."}, ensure_ascii=False, indent=4))
