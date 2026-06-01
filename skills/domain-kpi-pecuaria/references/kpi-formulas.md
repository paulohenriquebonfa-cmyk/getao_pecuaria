# KPI Formulas (v1)

## 1) GMD (kg/dia)

`GMD = (peso_final - peso_inicial) / dias_entre_pesagens`

Padrao:
- Se `dias_entre_pesagens <= 0`, retornar `0`.
- Se houver multiplas pesagens, usar serie temporal e permitir janelas (7d, 14d, ciclo).

## 2) Eficiencia alimentar

`EA = kg_consumo_total / kg_ganho_total`

Padrao:
- Quanto menor, melhor.
- Se `kg_ganho_total <= 0`, retornar `0` e registrar alerta tecnico.

## 3) Custo da diaria por cabeca

`custo_diaria_cabeca = (custos_fixos_periodo + custos_variaveis_periodo + custo_trato_periodo) / (cabecas_ativas_media * dias_periodo)`

Padrao:
- Usar cabecas medias ativas no periodo.
- Se denominador invalido, retornar `0`.

## 4) Custo da arroba produzida

`arrobas_produzidas = kg_ganho_total / 15`
`custo_arroba_produzida = custo_total_acumulado / arrobas_produzidas`

Padrao:
- Nao usar peso vivo total; usar ganho convertivel.

## 5) Break-even da arroba

`arrobas_vendaveis_estimadas = (peso_estimado_venda_total_kg) / 15`
`break_even_arroba = custo_total_acumulado / arrobas_vendaveis_estimadas`

Padrao:
- Atualizar com cotacao manual do dia para simulacoes de margem.

## 6) Projecao de abate (dias)

`dias_proj = (peso_meta_abate - peso_atual) / GMD_atual`

Padrao:
- Se `GMD_atual <= 0`, retornar `0` e marcar baixa confianca.

## 7) Bloqueio por carencia

`bloqueado = existe_tratamento_com(data_aplicacao + dias_carencia > data_referencia_embarque)`

Padrao:
- Se bloqueado, embarque deve ficar inelegivel.

## 8) DRE por lote

`lucro_liquido = receita_real_ou_estimada - custo_aquisicao - frete - custo_trato - custo_sanitario - custo_operacional`

Padrao:
- Separar resultado realizado vs projetado.
