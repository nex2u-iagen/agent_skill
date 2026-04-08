---
name: cp-fiscal-retencoes
description: >
  Agente Contador Público — ANÁLISE FISCAL DE RETENÇÕES — Lê PDFs de processos de pagamento (digitais, escaneados, fotos), detecta documentos fiscais (NF-e/DANFE, NFS-e, Fatura, Nota de Débito, Boleto), extrai dados estruturados (valores, retenções destacadas) e gera nota técnica com fundamentação legal. Stack 100% gratuita.
---

# cp-fiscal-retencoes v2

**Agente Contador Público | Análise de Retenções Tributárias em Processos de Pagamento**

Versão: 2.0.0
Data: 06/04/2026
Status: ✅ Produção

## O que é

Skill autossuficiente que processa processos administrativos com múltiplos documentos fiscais e gera análise automática de retenções tributárias conforme a legislação brasileira.

**Entrada:** Pasta com documentos do processo (PDFs digitais, escaneados, fotos)
**Saída:** Nota técnica + JSON consolidado + JSON fiscal + triagem

## Quando usar

Use esta skill SEMPRE que:
- ✅ Precisar ler PDF de processo de pagamento e extrair dados fiscais
- ✅ Identificar tipo de documento: NF-e/DANFE, NFS-e, Fatura, Nota de Débito, Boleto ou planilhas de retenção.
- ✅ Extrair: tomador/contratante, prestador/contratado, produto/serviço, valores, datas, competência
- ✅ Detectar retenções já destacadas na nota (IRRF, INSS, CSLL, PIS, COFINS, ISSQN)
- ✅ Calcular retenções devidas com memória de cálculo
- ✅ Gerar nota técnica com fundamentação legal completa
- ✅ Trabalhar com documentos escaneados, fotos ou PDFs de baixa qualidade
- ✅ Processos com formato misto (PDF digital + foto + escaneado)

## Stack Gratuita

| Componente | Função | Custo |
|------------|--------|-------|
| **PyMuPDF (fitz)** | Leitura de PDFs digitais | Free |
| **Tesseract OCR** | OCR para escaneados/fotos | Free |
| **pdf2image** | Converte PDF → imagem (OCR) | Free |
| **Ollama + qwen2.5** | LLM local para ambíguos | Free |

> **Opcional:** Groq API (free tier) como alternativa ao Ollama para classificação de documentos ambíguos.

## Como funciona

### 5 Etapas

```
ENTRADA (pasta com PDFs, fotos, escaneados)
    ↓
[ETAPA 1 - TRIAGEM] 🔍
  • PyMuPDF lê PDFs digitais (rápido)
  • Tesseract OCR processa escaneados/fotos
  • REGEX classifica tipo de documento
  • LLM local (Ollama) resolve ambíguos
    ↓
[ETAPA 2 - EXTRAÇÃO] 📋
  • NF-e: emitente, destinatário, produtos, CFOP, impostos
  • NFS-e: prestador, tomador, serviço, retenções, competência
  • Fatura: fornecedor, valores, vencimento
  • Nota de Débito: valor devido, encargos
  • Contrato: objeto, valor global, vigência
  • Empenho: número, valor empenhado
    ↓
[ETAPA 3 - CONSOLIDAÇÃO] 🔗
  • Identifica tomador/contratante vs prestador/contratado
  • Consolida valores (bruto, deduções, descontos, retenções, líquido)
  • Detecta estados, municípios, datas, competência
    ↓
[ETAPA 4 - CÁLCULO] 🧮
  • IRRF (IN RFB 1.234/2012)
  • INSS (Lei 8.212/91)
  • ISSQN (LC 116/2003)
  • PCC/CSLL/PIS/COFINS (Lei 10.833/03)
  • Considera retenções JÁ DESTACADAS na nota
    ↓
[ETAPA 5 - NOTA TÉCNICA] 📝
  • Documentos identificados
  • Partes envolvidas
  • Objeto (produto/serviço)
  • Valores financeiros detalhados
  • Datas e competência
  • Memória de cálculo
  • Fundamentação legal completa
  • Alertas e recomendações
  • Conclusão fundamentada
```

### Tipos de Documentos Detectados

| Tipo | Nome | Padrões Principais |
|------|------|-------------------|
| `nfe` | NF-e (DANFE) | "DANFE", "NF-e", "Chave de Acesso", "CFOP" |
| `nfse` | NFS-e | "Nota Fiscal de Serviço", "Código de Verificação", "LC 116" |
| `fatura` | Fatura/Duplicata | "Fatura", "Duplicata", "Vencimento", "Parcela" |
| `nota_debito` | Nota de Débito | "Nota de Débito", "Encargos Moratórios" |
| `boleto` | Boleto Bancário | "Boleto Bancário", "Linha Digitável" |
| `contrato` | Contrato (Ref. Valores) | "Contrato Administrativo", "Cláusula Primeira", "Vigência" |
| `empenho` | Empenho (Ref. Dotação) | "Nota de Empenho", "Dotação Orçamentária" |

### Dados Extraídos por Tipo

**NF-e (DANFE):**
- Número, série, chave de acesso, data de emissão
- Emitente (razão social, CNPJ)
- Destinatário (razão social)
- Natureza da operação, CFOP
- Descrição do produto
- Valor bruto, base ICMS, ICMS, IPI, PIS, COFINS, ISSQN, desconto
- Retenções destacadas (IRRF, INSS, CSLL, PIS, COFINS, ISSQN)

**NFS-e:**
- Número, código de verificação, data de emissão, competência
- Prestador (razão social, CNPJ)
- Tomador (razão social, CNPJ)
- Discriminação do serviço, código do serviço (LC 116)
- Valor dos serviços, deduções, descontos, ISS, valor líquido
- Retenções destacadas (IRRF, INSS, CSLL, PIS, COFINS)

**Fatura/Nota de Débito:**
- Número, data de emissão, vencimento
- Fornecedor (razão social, CNPJ)
- Valor bruto / valor devido

**Contrato:**
- Número do contrato, objeto, valor global, vigência

**Empenho:**
- Número do empenho, valor empenhado

## Usando a skill

### Instalação

```bash
# 1. Dependências Python
pip install -r requirements.txt

# 2. Tesseract OCR (sistema)
# Windows: baixar de https://github.com/UB-Mannheim/tesseract/wiki
# Linux: sudo apt install tesseract-ocr tesseract-ocr-por
# macOS: brew install tesseract tesseract-lang

# 3. Ollama (opcional, para LLM local)
# https://ollama.com
ollama pull qwen2.5
```

### Input

```bash
# Uso simples (auto-detecção completa)
python scripts/main.py /caminho/para/processo

# Com parâmetros fiscais conhecidos
python scripts/main.py /caminho/para/processo \
  --regime "Lucro Presumido" \
  --municipio-tomador "Maceió" \
  --municipio-prestador "São Paulo"

# Com LLM local para documentos ambíguos
python scripts/main.py /caminho/para/processo --llm-model qwen2.5

# Opções avançadas
python scripts/main.py /caminho/para/processo \
  --strategy hybrid \
  --output ./saida_fiscal \
  --max-pages 150 \
  --yes
```

**Parâmetros:**

| Parâmetro | Descrição | Default |
|-----------|-----------|---------|
| `caminho` | Pasta com documentos | Obrigatório |
| `--strategy` | `hybrid`, `regex` ou `llm` | `hybrid` |
| `--output` | Diretório de saída | `./documentos_gerados` |
| `--max-pages` | Limite de páginas por PDF | Sem limite |
| `--llm-model` | Modelo Ollama para ambíguos | Nenhum |
| `--regime` | Regime tributário | `Lucro Presumido` |
| `--cessao-mo` | Há cessão de mão de obra? | `False` |
| `--municipio-prestador` | Município do prestador | Auto-detectado |
| `--municipio-tomador` | Município do tomador | Auto-detectado |
| `--convenio-pcc` | Ente tem convênio RFB? | `False` |
| `--yes` | Pular confirmações | `False` |

### Output

As saídas são organizadas na pasta `documentos_gerados/`:
- **Notas Técnicas:** Pareceres fiscais em Markdown e PDF (se configurado).
- **Outros Documentos:** Certidões, relatórios e dados brutos.

**1. `documentos_gerados/Notas Tecnicas/nota_tecnica_padrao_ouro.md` — Nota Técnica Padrão Ouro**
```
══════════════════════════════════════════════════════════
║       NOTA TÉCNICA FISCAL — ANÁLISE DE RETENÇÕES       ║
══════════════════════════════════════════════════════════

1. DOCUMENTOS FISCAIS IDENTIFICADOS
  1. NFS-e
     Arquivo: 01_NOTA_SERVICO.pdf
     Páginas: 1, 2
     Confiança: 95% (extração por regex)
     Campos extraídos: numero_nota, data_emissao, competencia, ...

2. PARTES ENVOLVIDAS
  TOMADOR / CONTRATANTE:
    Razão Social: Prefeitura Municipal de Maceió
    CNPJ: 17.216.114/0001-74

  PRESTADOR / CONTRATADO:
    Razão Social: EMPRESA DE TECNOLOGIA LTDA
    CNPJ: 00.001.234/0001-56

3. OBJETO — PRODUTO OU SERVIÇO
  Descrição: Desenvolvimento de sistema web para gestão fiscal

4. VALORES FINANCEIROS
  Valor Bruto:              R$    25.000,00
  Deduções (serviços):      R$         0,00
  Retenções destacadas na nota:
    IRRF:        R$   1.200,00
    CSLL:        R$     500,00

5. DATAS E COMPETÊNCIA
  Data de Emissão: 15/03/2026
  Competência:     03/2026

6. MEMÓRIA DE CÁLCULO — RETENÇÕES TRIBUTÁRIAS
  IRRF:
    Alíquota: 4.80%
    Valor calculado:  R$   1.200,00
    Já destacado nota: R$   1.200,00
    Complemento:       R$       0,00
    Fundamento: IN RFB 1.234/2012, Anexo I — Código 1234

7. FUNDAMENTAÇÃO LEGAL E NORMATIVA
  1. IRRF: 4.80% sobre R$ 25.000,00 = R$ 1.200,00 conforme IN RFB 1.234/2012
  2. INSS: Não retido — Sem cessão de mão de obra

8. ALERTAS E RECOMENDAÇÕES
  ⚠️ Confirmar se o ente público possui convênio com RFB para PCC

9. CONCLUSÃO
  Após análise dos documentos fiscais apresentados, conclui-se que:
  a) O valor bruto da operação é de R$ 25.000,00;
  b) As retenções tributárias aplicáveis totalizam R$ 1.200,00;
  c) O valor líquido a pagar ao fornecedor é de R$ 23.800,00;
```

**2. `dados_consolidados.json` — Dados Estruturados**
```json
{
  "processo": {
    "data_consolidacao": "06/04/2026 14:30:00",
    "total_documentos": 5
  },
  "tomador_contratante": {
    "razao_social": "Prefeitura Municipal de Maceió",
    "cnpj": "17.216.114/0001-74"
  },
  "prestador_contratado_fornecedor": {
    "razao_social": "EMPRESA DE TECNOLOGIA LTDA",
    "cnpj": "00.001.234/0001-56"
  },
  "localizacao": {
    "estados_encontrados": ["AL", "SP"],
    "municipios_encontrados": ["Maceió", "São Paulo"]
  },
  "produto_servico": {
    "descricao": "Desenvolvimento de sistema web",
    "tipo_documento_origem": "nfse"
  },
  "valores": {
    "valor_bruto": 25000.00,
    "valor_deducoes": null,
    "valor_descontos": null,
    "retencoes_destacadas": {
      "irrf": 1200.00,
      "csll": 500.00
    },
    "total_retencoes_destacadas": 1700.00,
    "valor_liquido_nota": 23300.00
  },
  "datas": {
    "data_emissao": "15/03/2026",
    "competencia": "03/2026"
  },
  "documentos": [
    {
      "tipo": "nfse",
      "tipo_nome": "NFS-e",
      "arquivo": "01_NOTA_SERVICO.pdf",
      "paginas": [1, 2],
      "confianca": 0.95,
      "estrategia": "regex"
    }
  ]
}
```

**3. `resultado_fiscal.json` — Cálculo de Retenções**
```json
{
  "memoria_calculo": {
    "irrf": {
      "aliquota": 0.048,
      "valor_calculado": 1200.00,
      "valor_destacado_nota": 1200.00,
      "valor_a_reter": 0.0,
      "base_legal": "IN RFB 1.234/2012, Anexo I — Código 1234"
    }
  },
  "total_retido": 1200.00,
  "total_a_reter_agora": 0.00,
  "total_ja_retido_nota": 1200.00,
  "valor_liquido": 23800.00,
  "fundamentacao": [...],
  "alertas": [...]
}
```

## Base Normativa

### IRRF (Imposto de Renda Retido na Fonte)

| Situação | Alíquota | Base Legal |
|----------|----------|-----------|
| Lucro Presumido — Serviços | 4.80% | IN RFB 1.234/12, Anexo I, Código 1234 |
| Lucro Real — Serviços | 4.80% | IN RFB 1.234/12, Anexo I |
| Simples Nacional | Isento | Lei 14.754/23, Art. 11 |
| Profissional Liberal (PF) | 15.00% | RIR 2018, Art. 1º |
| PF Autônomo | 20.00% | RIR 2018 |

### INSS (Contribuição Previdenciária)

| Situação | Alíquota | Base Legal |
|----------|----------|-----------|
| Cessão de MO — PJ | 11.00% | Lei 8.212/91, Art. 31 |
| Simples Nacional c/ cessão MO | 3.50% | Lei 8.212/91, Anexo IV |
| Sem cessão de MO | 0% | Não se aplica |
| Contribuinte Individual (PF) | 12.00% | Lei 8.212/91, Art. 21 |

### ISSQN (Imposto sobre Serviços)

| Situação | Alíquota | Base Legal |
|----------|----------|-----------|
| Municípios diferentes (retenção no destino) | 5.00% (máx) | LC 116/03, Art. 3º |
| Mesmo município | 0% | Não se aplica |

### PCC (CSLL + PIS + COFINS Retidos)

| Situação | Alíquota | Base Legal |
|----------|----------|-----------|
| Ente com convênio RFB | 4.65% | Lei 10.833/03, Arts. 30-31 |
| Ente sem convênio | 0% | Sem obrigação |

## Estrutura de Diretórios

```
cp-fiscal-retencoes-v1/
│
├── SKILL.md                              ← Você está aqui
├── README.md                             ← Instalação rápida
├── requirements.txt                      ← Dependências
│
├── scripts/
│   ├── main.py                             ← Orquestrador principal
│   ├── triagem_hibrida.py                  ← Detecção de tipos (REGEX + LLM)
│   ├── extrator.py                         ← Extração de campos fiscais
│   ├── consolidador.py                     ← Consolidação de dados
│   ├── calculadora_retencoes.py            ← Cálculo de retenções
│   ├── gerador_parecer.py                  ← Geração de nota técnica
│   ├── render_gold_note.py                 ← Renderiza Nota Técnica Padrão Ouro
│   ├── check_env.py                        ← Diagnóstico de ambiente
│   └── utils.py                            ← Funções auxiliares
│
├── templates/
│   └── nota_tecnica_padrao_ouro.md         ← Template de Nota Técnica (genérico)
│
├── documentos_gerados/
│   ├── Notas Tecnicas/                     ← Saída de Pareceres (MD)
│   └── Outros Documentos/                  ← Logs, JSONs e outros arquivos
│
├── references/
│   ├── normativa_irrf.md                   ← IN RFB 1.234/2012
│   ├── normativa_inss.md                   ← Lei 8.212/91
│   ├── normativa_issqn.md                  ← LC 116/2003
│   └── normativa_pcc.md                    ← Lei 10.833/03
│
├── specs/
│   └── schema.json                         ← Schema de dados
│
└── test_processo/
    └── nfe_sample.txt                      ← Exemplo mínimo para testes
```

## Requisitos do Sistema

- Python 3.8+
- Tesseract OCR instalado no sistema
- PyMuPDF, pytesseract, pdf2image, Pillow
- Ollama (opcional, para LLM local)

## Fluxo de Uso

### Passo 1: Preparar Entrada

```bash
mkdir meu_processo
# Colocar PDFs, fotos, escaneados na pasta
ls meu_processo/
├── 01_NFS-e.pdf
├── 02_DANFE.pdf
├── 03_CERTIDAO.pdf
├── 04_ATESTO.jpg          ← foto escaneada
└── 05_CONTRATO.pdf
```

### Passo 2: Executar

```bash
python scripts/main.py ./meu_processo
```

### Passo 3: Revisar

```bash
# Nota Técnica Padrão Ouro (Markdown)
cat documentos_gerados/Notas\ Tecnicas/nota_tecnica_padrao_ouro.md

# Dados Consolidados
cat documentos_gerados/Outros\ Documentos/dados_consolidados.json
cat documentos_gerados/Outros\ Documentos/resultado_fiscal.json
```

## Alertas

| Alerta | Causa | Ação |
|--------|-------|------|
| ⚠️ "Prefeitura sem convênio PCC" | Ente municipal | Confirmar com secretaria |
| ⚠️ "Alíquota ISSQN pode variar" | Municípios diferentes | Consultar lei municipal |
| ⚠️ "Cessão de MO não confirmada" | Sem evidência | Consultar contrato |
| ⚠️ "Regime não identificado" | Dado ambíguo | Validar manualmente |

## Troubleshooting

### Erro: "tesseract is not installed"
```bash
# Windows: instalar de https://github.com/UB-Mannheim/tesseract/wiki
# Linux: sudo apt install tesseract-ocr tesseract-ocr-por
# macOS: brew install tesseract tesseract-lang
```

### Erro: "PDF com muitas páginas"
```bash
python scripts/main.py ./processo --max-pages 100
```

### Erro: "Sem texto em páginas escaneadas"
O Tesseract OCR processará automaticamente (mais lento, mas funciona).

### Documentos de baixa qualidade
A skill usa Tesseract OCR que funciona com imagens de qualidade razoável. Para documentos muito degradados, considere:
1. Usar `--llm-model qwen2.5` para classificação assistida por IA
2. Pré-processar imagens (aumentar contraste/resolução)

## Extensões Futuras

- [ ] Suporte a XML de NF-e (extração direta)
- [ ] Integração com sistema de folha/empenho
- [ ] Exportar para Word/PDF formatado
- [ ] Dashboard de retenções por período
- [ ] Integração com TCE
- [ ] Validação automática de CNPJ na RFB

## Licença

Pública. Criada para contadores públicos brasileiros.

## Suporte

- Receita Federal: www.gov.br/rfb
- Tribunal de Contas: www.tce.al.gov.br
- MCASP — Manual de Contabilidade Aplicada ao Setor Público
