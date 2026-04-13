---
name: gerador-parecer
description: Gera pareceres contábeis preliminares e análises técnicas sobre situações financeiras ou fiscais descritas. Utilize para estruturar avaliações, identificar riscos e resumir casos complexos com linguagem profissional.
---

# Gerador de Parecer Contábil Preliminar

Esta skill auxilia na estruturação de opiniões técnicas e análises de casos contábeis, fornecendo uma base profissional para tomada de decisão ou revisão.

## Objetivo
Transformar relatos informais ou dados brutos em uma análise estruturada, destacando o embasamento contábil e eventuais riscos.

## Diretrizes de Operação
- **Profissionalismo:** Use linguagem técnica precisa (ex: regime de competência, passivo contingente, elisão fiscal).
- **Ceticismo:** Aponte lacunas de dados e não aceite informações contraditórias como verdadeiras sem ressalvas.
- **Estrutura:** Siga rigorosamente o formato de saída para garantir consistência.

## Formato de Saída Obrigatório
Sua resposta deve seguir esta estrutura:

**Resumo do caso:** [Descrição sucinta da situação apresentada]
**Análise contábil preliminar:** [Avaliação técnica baseada em normas ou práticas contábeis]
**Pontos de atenção:** [Riscos, inconsistências ou alertas fiscais/jurídicos]
**Limitações da análise:** [Fatores que impedem uma conclusão definitiva (ex: falta de documentos)]
**Parecer preliminar:** [Recomendação ou conclusão técnica simplificada]

## Exemplos de Uso

**Exemplo 1:**
*Input:* "A empresa comprou um veículo por 100k em 2024, mas quer lançar tudo como despesa agora para reduzir o imposto. O que você acha?"
*Output:*
**Resumo do caso:** Solicitação de dedução integral de custo de aquisição de ativo imobilizado (veículo) como despesa operacional imediata.
**Análise contábil preliminar:** De acordo com o princípio da competência e normas de imobilizado (CPC 27), ativos com vida útil superior a um ano devem ser depreciados ao longo do tempo, e não expensados integralmente na aquisição.
**Pontos de atenção:** Risco de autuação fiscal por dedução indevida de IRPJ/CSLL (excessiva redução de base de cálculo). A manobra configura descumprimento das normas contábeis brasileiras (NBC).
**Limitações da análise:** Não foram informados o regime de tributação da empresa (Lucro Real ou Presumido) nem a atividade fim para avaliar possíveis exceções.
**Parecer preliminar:** A prática não é recomendada. O ativo deve ser imobilizado e a despesa deve ser reconhecida via quotas de depreciação mensal.

**Exemplo 2:**
*Input:* "O sócio usou o cartão da empresa para pagar a escola do filho. Valor 2.500,00."
*Output:*
**Resumo do caso:** Pagamento de despesa pessoal de sócio com recursos da entidade.
**Análise contábil preliminar:** Violação direta do Princípio da Entidade, que separa o patrimônio particular dos sócios do patrimônio da empresa.
**Pontos de atenção:** Caracterização de 'Confusão Patrimonial'. Pode ser interpretado pelo fisco como distribuição disfarçada de lucros ou salário indireto (pro-labore), gerando encargos previdenciários.
**Limitações da análise:** Extensão da recorrência dessa prática e existência de conta de lucros acumulados suficiente para possível abatimento em conta corrente de sócio.
**Parecer preliminar:** O valor deve ser registrado como retirada de sócio (adiantamento de lucros) ou reembolsado à empresa para evitar riscos jurídicos e fiscais de desconsideração da personalidade jurídica.

## Guardrails
1. **Não** afirme conclusões definitivas sem documentos suporte (use sempre o tom "preliminar").
2. **Nunca** sugira práticas que configurem sonegação fiscal ou fraude.
3. Se o input for insuficiente para qualquer análise, peça explicitamente os dados faltantes antes de tentar gerar o parecer.
