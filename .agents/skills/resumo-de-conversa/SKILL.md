---
name: resumo-de-conversa
description: Gera um resumo da conversa atual entre o agente e o usuário que está solicitando.
---

# Resumo da Conversa Atual com o Agente

Esta skill é responsável por consolidar e resumir a conversa atual entre o agente e o usuário. Seu objetivo principal é fornecer uma visão concisa do diálogo, facilitando a revisão ou o acompanhamento.

## Objetivo
Processar o histórico da conversa atual para extrair os pontos chave e apresentar um resumo coerente e informativo.

## Regras de Operação

1. **Escopo do Resumo:** O resumo deve focar nas interações da sessão atual entre o agente e o usuário.
2. **Formato:** O resumo deve ser apresentado em texto corrido, de fácil leitura. Evite listas detalhadas ou transcrições literais, a menos que seja especificamente solicitado.
3. **Clareza e Concisão:** O objetivo é a brevidade sem perder o contexto principal da conversa.
4. **Segurança e Privacidade:** Priorize a segurança e a privacidade dos dados. Não exponha informações sensíveis no resumo.
5. **Identificação do Usuário:** A skill deve identificar de forma clara o usuário que solicitou o resumo, preferencialmente utilizando um identificador único e consistente (ex: nome de usuário, ID da sessão), se disponível no contexto da interação.

## Formato de Saída Obrigatório

Seu resumo deve seguir um formato claro, indicando o interlocutor e um texto sintetizado:

Interlocutor: Usuário (Sessão Atual)
Resumo da Conversa: [Texto conciso com os pontos chave da interação da sessão atual]

## Exemplos de Uso

**Exemplo 1:**
*Input do Usuário:* "Pode fazer um resumo da nossa conversa até agora?"
*Simulação da Conversa:*
Usuário: "Criei uma skill que faz um resumo de conversas do bot no telegram por usuário."
Agente: "Qual o nome da skill e onde está localizada?"
Usuário: "nome da skill será resumo de conversa, e pode criar uma pasta dentro do skill do .agent"
Agente: "Criei a pasta e o SKILL.md. O que mais?"
Usuário: "Vamos ajustar para você fazer o resumo das conversas do usuário que esta conversando..."
*Output da Skill:*
Interlocutor: Usuário (Sessão Atual)
Resumo da Conversa: O usuário criou uma skill chamada 'resumo-de-conversa' e solicitou a criação da pasta e do SKILL.md. Posteriormente, pediu para ajustar a skill para resumir a conversa atual entre o agente e o próprio usuário.

**Exemplo 2:**
*Input do Usuário:* "Resuma o que discutimos nas últimas mensagens."
*Simulação da Conversa:*
Agente: "A skill 'classificador-documentos' foi atualizada com uma regra para ambiguidade de input."
Usuário: "Ótimo. E a 'resumo-de-conversa'?"
Agente: "A skill 'resumo-de-conversa' foi ajustada para focar na sessão atual."
*Output da Skill:*
Interlocutor: Usuário (Sessão Atual)
Resumo da Conversa: Foram feitas atualizações na skill 'classificador-documentos' e na skill 'resumo-de-conversa', que foi ajustada para focar na sessão atual entre o agente e o usuário.