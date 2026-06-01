---
name: domain-kpi-pecuaria
description: Padroniza calculo, validacao e interpretacao de KPIs de engorda/semi-confinamento bovino. Use quando houver implementacao, revisao, teste ou depuracao de regras de negocio para GMD, eficiencia alimentar, custo da diaria, custo da arroba produzida, break-even, projecao de abate, bloqueio por carencia e DRE por lote.
---

# Domain KPI Pecuaria

Use esta skill para manter consistencia entre API, mobile, web e relatorios.

## Executar fluxo padrao

1. Identificar o KPI solicitado e o contexto: lote, animal, periodo, pesagem de referencia.
2. Carregar formulas e definicoes em [references/kpi-formulas.md](references/kpi-formulas.md).
3. Verificar prerequisitos minimos de dados antes de calcular:
   - data de entrada do lote
   - peso de entrada
   - pelo menos uma pesagem para KPIs de ganho
   - custos acumulados no periodo
4. Aplicar politicas padrao:
   - evitar divisao por zero (retornar `0` quando denominador invalido)
   - normalizar casas decimais: KPI tecnico com 4, KPI financeiro com 2
   - preservar rastreabilidade da janela de calculo
5. Validar resultado com cenarios de referencia antes de concluir.

## Regras obrigatorias

- Tratar ganho de peso negativo como alerta de manejo; nao mascarar silenciosamente.
- Diferenciar `custo da arroba comprada` de `custo da arroba produzida`.
- Em projeção de abate, usar curva recente de GMD quando disponivel; na ausencia, usar media do lote no ciclo.
- Em carencia sanitaria, bloquear elegibilidade de embarque ate o fim do prazo.

## Saida esperada

Quando responder ou implementar:
- declarar formula usada
- declarar periodo analisado
- declarar fonte dos dados (pesagem, trato, custos, cotacao)
- declarar limite/assuncao quando houver dado faltante
