import pandas as pd
import re
import json
import os
from datetime import datetime

def extract_spreadsheet_data(spreadsheet_path):
    try:
        if spreadsheet_path.endswith('.xlsx'):
            df = pd.read_excel(spreadsheet_path)
        elif spreadsheet_path.endswith('.csv'):
            df = pd.read_csv(spreadsheet_path)
        else:
            return {"error": "Formato de planilha não suportado. Apenas .xlsx e .csv são aceitos."}
    except Exception as e:
        return {"error": f"Erro ao ler a planilha: {e}"}

    # Inicializar lista para armazenar dados de cada linha/nota
    extracted_notes = []

    # Converter nomes de colunas para minúsculas para facilitar a busca
    df.columns = df.columns.str.lower()

    for index, row in df.iterrows():
        note_data = {
            "tipo": "Não identificado",
            "emissor": "Não identificado",
            "data": "Não identificada",
            "valor": "Não identificado",
            "linha_original": row.to_dict() # Armazenar a linha completa para contexto
        }

        row_text = " ".join(row.dropna().astype(str).values) # Concatena o texto da linha para busca de palavras-chave

        # Detectar Tipo de Nota (Entrada/Saída)
        entrada_keywords = re.compile(r"compra|recebimento|entrada|remessa|devolução de venda", re.IGNORECASE)
        saida_keywords = re.compile(r"venda|saída|prestação de serviço|remessa para cliente|devolução de compra", re.IGNORECASE)

        if entrada_keywords.search(row_text):
            note_data["tipo"] = "Entrada"
        elif saida_keywords.search(row_text):
            note_data["tipo"] = "Saída"

        # Extrair Emissor
        emissor_col_candidates = ['emissor', 'fornecedor', 'cliente', 'razao social', 'nome empresa']
        for col in emissor_col_candidates:
            if col in df.columns and pd.notna(row[col]):
                note_data["emissor"] = str(row[col]).strip()
                break

        # Extrair Data
        date_col_candidates = ['data', 'data emissao', 'data da nota', 'data nf']
        for col in date_col_candidates:
            if col in df.columns and pd.notna(row[col]):
                date_val = str(row[col]).strip()
                try:
                    # Tentar diferentes formatos de data
                    if re.match(r"\d{4}-\d{2}-\d{2}", date_val): # YYYY-MM-DD
                        note_data["data"] = datetime.strptime(date_val, "%Y-%m-%d").strftime("%d/%m/%Y")
                    elif re.match(r"\d{2}/\d{2}/\d{4}", date_val): # DD/MM/YYYY
                        note_data["data"] = date_val
                    elif re.match(r"\d{8}", date_val): # DDMMYYYY
                         note_data["data"] = datetime.strptime(date_val, "%d%m%Y").strftime("%d/%m/%Y")
                    else:
                        note_data["data"] = date_val # Manter como está se não reconhecer
                except ValueError:
                    note_data["data"] = date_val # Manter como está em caso de erro
                break

        # Extrair Valor
        valor_col_candidates = ['valor', 'valor total', 'total', 'vlr total', 'liquido']
        for col in valor_col_candidates:
            if col in df.columns and pd.notna(row[col]):
                try:
                    # Converte para string para manipulação
                    valor_str = str(row[col])
                    # Se o separador decimal for vírgula (padrão brasileiro), substitui por ponto
                    if ',' in valor_str and '.' not in valor_str:
                        valor_str = valor_str.replace(',', '.')
                    # Remove separador de milhares se houver (ponto seguido por 3 dígitos)
                    valor_str = re.sub(r'\.(?=\d{3})', '', valor_str)

                    note_data["valor"] = f"{float(valor_str):.2f}".replace('.', ',') # Formatar para R$ X,XXX.XX
                except ValueError:
                    note_data["valor"] = str(row[col]).strip() # Manter como string se não for numérico
                break

        extracted_notes.append(note_data)

    return extracted_notes

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        spreadsheet_file_path = sys.argv[1]
        if os.path.exists(spreadsheet_file_path):
            extracted_data = extract_spreadsheet_data(spreadsheet_file_path)
            print(json.dumps(extracted_data, ensure_ascii=False, indent=4))
        else:
            print(json.dumps({"error": f"Arquivo de planilha não encontrado: {spreadsheet_file_path}"}, ensure_ascii=False, indent=4))
    else:
        print(json.dumps({"error": "Nenhum caminho de arquivo de planilha fornecido."}, ensure_ascii=False, indent=4))
