---
name: classificador-simples-nacional
description: "Classifica documentos contábeis, especificamente notas fiscais (NF-e, NFS-e, etc.) de entrada e saída, para empresas optantes pelo Simples Nacional. Use esta skill sempre que o usuário mencionar ou fornecer arquivos (planilhas ou PDFs) que contenham termos como 'NF', 'nota', 'nota fiscal', 'DANFE', 'documento fiscal', e o objetivo for categorizar estes documentos no contexto de contabilidade para empresas do Simples Nacional."
compatibility:
  - run_shell_command
  - read_file
  - write_file
  - grep_search
  - glob
  - python (para scripts auxiliares)
---

## Visão Geral

Esta skill é projetada para auxiliar na organização e classificação de documentos fiscais de empresas do Simples Nacional. Ela identifica o tipo de nota fiscal (entrada ou saída) e extrai informações chave para gerar um resumo em formato Markdown (`.md`).

## Fluxo de Trabalho

1.  **Identificação do Documento:**
    *   A skill receberá um arquivo (PDF ou planilha, por exemplo) que o usuário deseja classificar.
    *   Utilizará scripts auxiliares (`pdf_parser.py` ou `spreadsheet_parser.py`) para extrair o texto/dados do documento.

2.  **Extração de Informações Chave:**
    *   **Tipo de Nota Fiscal:** Determinar se é uma nota de entrada ou saída. Isso será inferido por palavras-chave e padrões de texto como "Remetente", "Destinatário", "Venda", "Compra", "Serviços Prestados", "Serviços Tomados".
    *   **Emissor:** Identificar o nome ou razão social do emissor da nota, utilizando padrões de texto ou buscando por CNPJs/CPFs associados a nomes.
    *   **Data:** Extrair a data de emissão do documento, buscando por formatos comuns de data.
    *   **Valor:** Localizar o valor total da nota fiscal, buscando por padrões numéricos com prefixos "R$" ou "Total".

3.  **Classificação para Simples Nacional:**
    *   A skill considerará que a empresa é do Simples Nacional. A classificação de entrada/saída é o foco principal.

4.  **Geração do Arquivo de Saída:**
    *   Criar um arquivo `.md` com o seguinte formato:
        ```markdown
        # Classificação de Documento Fiscal

        **Tipo:** [Entrada/Saída]
        **Emissor:** [Nome do Emissor]
        **Data:** [DD/MM/AAAA]
        **Valor Total:** R$ [Valor]

        ---

        ## Detalhes (se disponível)
        [Conteúdo resumido ou trechos relevantes do documento original, se a extração for possível e relevante.]
        ```
    *   O nome do arquivo `.md` deve seguir o padrão: `[Nome do Emissor]_[Data]_[Valor].md`. Por exemplo: `EmpresaX_2023-01-15_1500.00.md`.

## Considerações Importantes

*   A skill precisa de acesso aos arquivos para leitura. O usuário deve fornecer o caminho completo do arquivo.
*   A precisão da extração de dados dependerá da clareza e estrutura dos documentos fornecidos. Para PDFs escaneados, a precisão pode ser menor, e a skill tentará processá-los como texto, mas a performance será otimizada para PDFs nativos.

## Exemplos de Uso

*   "Classifique este PDF de nota fiscal: /caminho/para/minha_nf.pdf"
*   "Analise a planilha de notas que recebi e classifique as entradas e saídas."
*   "Tenho um arquivo chamado 'notas_fiscais_jan.pdf', por favor classifique-o."

## Recursos Auxiliares

*   `scripts/pdf_parser.py`: Um script Python para extrair texto de PDFs (nativos) e identificar palavras-chave para classificação e extração de dados. Utilizará a biblioteca `pdfplumber`.
*   `scripts/spreadsheet_parser.py`: Um script Python para processar planilhas (XLSX, CSV) e extrair dados relevantes. Utilizará a biblioteca `pandas`.

---

**Próximos Passos:**

1.  Desenvolver os scripts auxiliares `pdf_parser.py` e `spreadsheet_parser.py`.
2.  Criar os casos de teste com prompts de exemplo e documentos de entrada.
3.  Executar os testes e iterar sobre a skill para melhorias.
