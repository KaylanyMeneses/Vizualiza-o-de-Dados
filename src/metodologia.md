---
title: Metodologia
---

```js
{
  const style = document.createElement("style")
  style.textContent = `
    .met-hero { padding: 4rem 0 2.5rem; border-bottom: 1px solid #1e293b; }
    .met-hero h1 { font-size: 2rem; font-weight: 800; color: #f8fafc; margin-bottom: .6rem; }
    .met-hero p  { color: #64748b; font-size: .97rem; max-width: 680px; line-height: 1.8; }

    .pipeline {
      display: flex; flex-direction: column; gap: 0;
      border-left: 2px solid #1e3a5f; margin: 2.5rem 0 3rem 1rem;
    }
    .pip-step { display: flex; gap: 1.2rem; padding: .9rem 0 .9rem 1.4rem; position: relative; }
    .pip-step::before {
      content: ""; position: absolute; left: -5px; top: 1.15rem;
      width: 8px; height: 8px; border-radius: 50%;
      background: #3b82f6; border: 2px solid #0f172a;
    }
    .pip-num { font-size: .7rem; font-weight: 700; color: #3b82f6; letter-spacing: .08em;
               min-width: 32px; padding-top: 2px; }
    .pip-body h4 { font-size: .9rem; font-weight: 700; color: #e2e8f0; margin: 0 0 .25rem; }
    .pip-body p  { font-size: .83rem; color: #94a3b8; line-height: 1.7; margin: 0; }
    .pip-body code { background: #1e293b; color: #93c5fd; padding: 1px 5px;
                     border-radius: 4px; font-size: .78rem; }

    .section { padding: 3rem 0; border-bottom: 1px solid #1e293b; }
    .section-label { font-size: .68rem; letter-spacing: .12em; text-transform: uppercase;
                     color: #475569; margin-bottom: 1.6rem; }
    .section h2 { font-size: 1.25rem; font-weight: 700; color: #f1f5f9; margin-bottom: .7rem; }
    .section p  { color: #94a3b8; font-size: .88rem; line-height: 1.8; max-width: 820px; margin-bottom: .6rem; }

    .hyp-block { border-left: 3px solid #3b82f6; padding: 1rem 1.4rem;
                 background: #0f172a; border-radius: 0 8px 8px 0; margin: 1.4rem 0; }
    .hyp-block.orange { border-color: #f59e0b; }
    .hyp-block.green  { border-color: #10b981; }
    .hyp-block.purple { border-color: #8b5cf6; }
    .hyp-block h3 { font-size: .78rem; font-weight: 700; letter-spacing: .06em;
                    text-transform: uppercase; margin: 0 0 .4rem; color: #93c5fd; }
    .hyp-block.orange h3 { color: #fbbf24; }
    .hyp-block.green  h3 { color: #34d399; }
    .hyp-block.purple h3 { color: #a78bfa; }
    .hyp-block p { color: #94a3b8; font-size: .85rem; line-height: 1.7; margin: 0; }

    .metric-table { width: 100%; border-collapse: collapse; margin: 1.2rem 0; font-size: .84rem; }
    .metric-table th { text-align: left; color: #475569; font-size: .7rem; letter-spacing: .08em;
                       text-transform: uppercase; padding: .5rem .8rem; border-bottom: 1px solid #1e293b; }
    .metric-table td { padding: .6rem .8rem; color: #94a3b8; line-height: 1.6;
                       border-bottom: 1px solid #0f172a; vertical-align: top; }
    .metric-table td:first-child { color: #e2e8f0; font-family: monospace; font-size: .8rem;
                                   white-space: nowrap; }
    .metric-table tr:hover td { background: #0f172a; }

    .source-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                   gap: 1rem; margin-top: 1.4rem; }
    .source-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px;
                   padding: 1rem 1.2rem; }
    .source-card .s-label { font-size: .68rem; font-weight: 700; letter-spacing: .08em;
                             text-transform: uppercase; color: #3b82f6; margin-bottom: .35rem; }
    .source-card h4 { font-size: .88rem; font-weight: 700; color: #e2e8f0; margin: 0 0 .3rem; }
    .source-card p  { font-size: .78rem; color: #64748b; line-height: 1.6; margin: 0; }

    .formula { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px;
               padding: .8rem 1.2rem; font-family: monospace; font-size: .82rem;
               color: #93c5fd; margin: .8rem 0; }

    .fade-section { opacity:0; transform:translateY(30px); transition:opacity .8s ease, transform .8s ease; }
    .fade-section.visible { opacity:1; transform:translateY(0); }
  `
  document.head.appendChild(style)
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add("visible"); io.unobserve(e.target) } })
  }, {threshold: 0.07})
  setTimeout(() => document.querySelectorAll(".fade-section").forEach(el => io.observe(el)), 150)
}
```

<div class="met-hero fade-section">

# Metodologia

Como os dados foram coletados, processados e transformados em visualizações — passo a passo.

<p>Esta página documenta todo o pipeline técnico: fontes, algoritmos, métricas e decisões de design de cada visualização apresentada na análise.</p>

</div>

---

<!-- ══ PIPELINE ══ -->

<div class="section fade-section">
<p class="section-label">Visão geral · Pipeline de dados</p>

## Do mercado ao gráfico em 10 passos

O pipeline é executado inteiramente em Python e exporta arquivos CSV e JSON que alimentam o Observable Framework diretamente — sem servidor intermediário.

<div class="pipeline">

<div class="pip-step">
<div class="pip-num">01</div>
<div class="pip-body">
<h4>Composição do Ibovespa — API B3</h4>
<p>Lista oficial dos ativos do índice obtida via endpoint público da B3 (<code>sistemaswebb3-listados.b3.com.br</code>). Retorna ticker, nome e peso de cada ação. Parâmetros: <code>index=IBOV</code>, <code>pageSize=120</code>.</p>
</div>
</div>

<div class="pip-step">
<div class="pip-num">02</div>
<div class="pip-body">
<h4>Validação de tickers no Yahoo Finance</h4>
<p>Cada ticker da B3 (no formato <code>PETR4.SA</code>) é testado contra o Yahoo Finance com uma janela de 5 dias. Tickers sem dados são descartados antes do download completo, evitando falhas silenciosas.</p>
</div>
</div>

<div class="pip-step">
<div class="pip-num">03</div>
<div class="pip-body">
<h4>Download histórico OHLCV (2018–2025)</h4>
<p>Série completa via <code>yfinance</code> com <code>auto_adjust=True</code> — preços já ajustados por splits e dividendos. Formato long: uma linha por dia × ação. Gaps pontuais (feriados) preenchidos por interpolação temporal com limite de 5 dias.</p>
</div>
</div>

<div class="pip-step">
<div class="pip-num">04</div>
<div class="pip-body">
<h4>Cálculo de derivados por ticker</h4>
<p>Para cada ação são calculados: <code>return_daily</code> (retorno % simples), <code>log_return</code> (base para correlação), <code>volatility_20d</code> (desvio padrão rolling 20d anualizado), <code>amplitude_intraday</code> ((High−Low)/Open × 100), e <code>cumulative_return</code> acumulado desde 2018-01-02.</p>
</div>
</div>

<div class="pip-step">
<div class="pip-num">05</div>
<div class="pip-body">
<h4>Consolidação e export de CSVs</h4>
<p>Dataset final em long format (~80 ações × ~1800 dias). Exportados também pivôs de fechamento e log-retorno (datas × tickers) para uso nas correlações.</p>
</div>
</div>

<div class="pip-step">
<div class="pip-num">06</div>
<div class="pip-body">
<h4>Grafos de correlação por período</h4>
<p>Matriz de correlação de Pearson calculada sobre log-retornos para cada janela histórica. Limiar: <code>|r| ≥ 0.5</code> → aresta. Exportado como JSON com nós (ticker, volume médio) e arestas (correlação, peso).</p>
</div>
</div>

<div class="pip-step">
<div class="pip-num">07</div>
<div class="pip-body">
<h4>Métricas de rede trimestrais (H1 e H2)</h4>
<p>Para cada trimestre: correlação média absoluta, densidade da rede, número de arestas, maior componente conectado, modularidade (Louvain), NMI vs. setor oficial e participação intra-setor das comunidades.</p>
</div>
</div>

<div class="pip-step">
<div class="pip-num">08</div>
<div class="pip-body">
<h4>Beta Selic por setor e por ticker (H3)</h4>
<p>Regressão OLS de retornos acumulados em janelas de 30 dias após decisão do COPOM contra a variação da Selic. Beta > 0 = beneficiado pela alta de juros. Calculado por setor (agregado) e por ticker × ano.</p>
</div>
</div>

<div class="pip-step">
<div class="pip-num">09</div>
<div class="pip-body">
<h4>Taxa Selic histórica — API Banco Central</h4>
<p>Séries do SGS/BCB: <strong>série 432</strong> (Meta Selic fixada pelo COPOM, % a.a.) e <strong>série 11</strong> (Selic efetiva diária). Endpoint: <code>api.bcb.gov.br/dados/serie/bcdata.sgs.{serie}/dados</code>.</p>
</div>
</div>

<div class="pip-step">
<div class="pip-num">10</div>
<div class="pip-body">
<h4>Setor e indústria — Yahoo Finance</h4>
<p>Metadados de setor via <code>yf.Ticker().info</code>: <code>sector</code>, <code>industry</code>, <code>longName</code>. Usado como tabela de lookup para colorir e filtrar as visualizações por setor da B3.</p>
</div>
</div>

</div>
</div>

<!-- ══ H1 ══ -->

<div class="section fade-section">
<p class="section-label">H1 · Crises</p>

## Colapso de correlação em crises

<div class="hyp-block">
<h3>Hipótese</h3>
<p>Durante crises (ex: COVID-19), as correlações entre ações aumentam drasticamente — o mercado entra em modo pânico e os ativos passam a se mover como um bloco único.</p>
</div>

**Como foi construído:** para cada trimestre entre 2018 e 2025, calculamos a matriz de correlação de Pearson sobre os log-retornos diários de todos os ativos com ao menos 30 observações válidas naquele período. A partir dessa matriz construímos um grafo não-direcionado onde cada aresta representa uma correlação acima do limiar.

<div class="formula">r_ij = Pearson(log_return_i, log_return_j) · janela trimestral</div>

<table class="metric-table">
<thead><tr><th>Métrica</th><th>O que mede</th><th>Como interpretar</th></tr></thead>
<tbody>
<tr><td>avg_abs_corr</td><td>Média do valor absoluto de todas as correlações da rede naquele trimestre</td><td>Alto em crises (todos se movem juntos); baixo em períodos normais</td></tr>
<tr><td>density</td><td>Proporção de arestas existentes sobre o total possível</td><td>Rede densa = mercado sincronizado; rede esparsa = setores independentes</td></tr>
<tr><td>n_edges</td><td>Número de pares de ações com |r| ≥ 0.5 naquele trimestre</td><td>Reflete diretamente a intensidade das co-movimentações</td></tr>
<tr><td>largest_component_share</td><td>Fração dos nós pertencentes ao maior componente conectado</td><td>Próximo de 1 em crises → todos conectados; menor em calma</td></tr>
</tbody>
</table>

**Visualização:** gráfico de linha com área preenchida. Canal visual (posição y) encoda diretamente o valor da métrica selecionada ao longo do tempo. Tooltip com valor exato ao passar o mouse.

</div>

<!-- ══ H2 ══ -->

<div class="section fade-section">
<p class="section-label">H2 · Recuperação</p>

## Reorganização setorial após crises

<div class="hyp-block orange">
<h3>Hipótese</h3>
<p>Após crises, a estrutura de rede se reorganiza: setores voltam a divergir e as comunidades detectadas passam a coincidir mais com a classificação oficial da B3.</p>
</div>

**Como foi construído:** sobre cada grafo trimestral aplicamos o **algoritmo de Louvain** para detecção de comunidades. Louvain é um método hierárquico que maximiza a modularidade da partição de forma gulosa, com complexidade O(n log n).

<div class="formula">Q = (1/2m) · Σ_ij [ A_ij − k_i·k_j/2m ] · δ(c_i, c_j)</div>

Onde `m` = número de arestas, `A_ij` = peso da aresta, `k_i` = grau do nó i, `δ(c_i, c_j)` = 1 se i e j pertencem à mesma comunidade.

<table class="metric-table">
<thead><tr><th>Métrica</th><th>O que mede</th><th>Como interpretar</th></tr></thead>
<tbody>
<tr><td>modularity</td><td>Qualidade da partição em comunidades (Louvain Q)</td><td>Alto = comunidades bem definidas; baixo = rede indiferenciada</td></tr>
<tr><td>nmi_sector</td><td>Informação Mútua Normalizada entre comunidades detectadas e setores B3</td><td>1 = comunidades coincidem perfeitamente com setores; 0 = sem relação</td></tr>
<tr><td>intra_sector_share</td><td>Fração de arestas que ligam ações do mesmo setor</td><td>Alto = mercado se organiza por setor; baixo = agrupamentos transversais</td></tr>
</tbody>
</table>

**Visualização:** três linhas sobrepostas com legenda clicável para mostrar/ocultar. Eixo Y fixo em [0,1] para permitir comparação direta entre as três métricas normalizadas.

</div>

<!-- ══ H3 ══ -->

<div class="section fade-section">
<p class="section-label">H3 · Selic</p>

## Sensibilidade setorial à taxa de juros

<div class="hyp-block green">
<h3>Hipótese</h3>
<p>Setores como financeiro e utilidades apresentam maior sensibilidade à Selic do que commodities exportadoras, que são protegidas pela receita em dólar.</p>
</div>

**Como foi construído:** para cada decisão do COPOM entre 2018 e 2025, extraímos a janela de 30 dias úteis seguintes e calculamos o retorno acumulado de cada ativo nesse período. Em seguida, rodamos uma **regressão OLS** do retorno médio pós-COPOM contra a variação da Selic naquela decisão:

<div class="formula">retorno_30d = α + β · Δselic + ε</div>

O coeficiente **β (beta Selic)** mede a sensibilidade: quanto o retorno do setor tende a variar para cada ponto percentual de mudança na Selic.

<table class="metric-table">
<thead><tr><th>Métrica</th><th>O que mede</th><th>Como interpretar</th></tr></thead>
<tbody>
<tr><td>beta</td><td>Inclinação da regressão retorno × ΔSelic</td><td>β > 0: setor se beneficia de alta de juros; β < 0: sofre com alta</td></tr>
<tr><td>pvalue</td><td>Significância estatística do beta (teste t bilateral)</td><td>p < 0.05 = relação estatisticamente significativa</td></tr>
<tr><td>r2</td><td>Variância do retorno explicada pela Selic</td><td>Alto = Selic é boa preditora; baixo = outros fatores dominam</td></tr>
<tr><td>beta_band</td><td>Classificação qualitativa do beta por ticker</td><td>"Mais sensível" / "Intermediário" / "Menos sensível"</td></tr>
<tr><td>median_return_30d</td><td>Mediana do retorno em janelas de 30d pós-COPOM</td><td>Contexto de retorno esperado independente da direção da Selic</td></tr>
</tbody>
</table>

**Visualizações:** (1) barras horizontais ordenadas por beta — canal visual posição + comprimento encoda diretamente a magnitude; azul para positivo, vermelho para negativo. (2) Árvore radial por ticker, navegável por ano, com tamanho do nó proporcional ao |beta|.

</div>

<!-- ══ H4 ══ -->

<div class="section fade-section">
<p class="section-label">H4 · Comunidades</p>

## Detecção de comunidades setoriais

<div class="hyp-block purple">
<h3>Hipótese</h3>
<p>Algoritmos de detecção revelam agrupamentos que refletem — e às vezes transgridem — a classificação setorial oficial, expondo relações estruturais entre empresas de setores distintos.</p>
</div>

**Como foi construído:** a rede de correlação é visualizada como um **grafo force-directed** com física D3. Cada nó é um ativo; cada aresta é um par com |r| ≥ 0.5. A força de agrupamento por setor (`clusterForce`) empurra nós do mesmo setor em direção ao centroide do grupo, mantendo a estrutura legível.

<table class="metric-table">
<thead><tr><th>Elemento visual</th><th>O que encoda</th></tr></thead>
<tbody>
<tr><td>Cor do nó</td><td>Setor da B3 (mesmo esquema de cores em todas as visualizações)</td></tr>
<tr><td>Tamanho do nó</td><td>Volume médio negociado no período selecionado</td></tr>
<tr><td>Espessura da aresta</td><td>Força da correlação (|r| entre 0.5 e 1.0)</td></tr>
<tr><td>Cor da aresta (ao clicar)</td><td>Vermelho = conexão do nó selecionado; cinza = inativo</td></tr>
<tr><td>Brilho (filter:glow)</td><td>Nó atualmente selecionado</td></tr>
</tbody>
</table>

O slider seleciona entre os **9 períodos históricos** pré-definidos. As posições dos nós são preservadas entre mudanças de período para facilitar a comparação visual.

</div>

<!-- ══ SÉRIES TEMPORAIS ══ -->

<div class="section fade-section">
<p class="section-label">Ponto de partida</p>

## Séries temporais de retorno acumulado

**Como foi construído:** o retorno acumulado é calculado como produto dos fatores diários a partir da primeira data disponível de cada ação:

<div class="formula">cumulative_return_t = (Π (1 + return_daily_i)) − 1 · 100%</div>

Normalizado para partir de zero em 2018-01-02. Ações com menos de 50 dias válidos são descartadas. A linha parte do log-retorno, que é simétrico e aditivo — propriedade importante para comparações entre ativos de escalas diferentes.

**Visualização:** múltiplas linhas com legenda clicável por setor. Clique em uma linha destaca o ticker individualmente; clique na legenda filtra por setor inteiro. Canal visual principal é posição y (retorno acumulado %) — evita ambiguidade de cor para séries sobrepostas.

</div>

<!-- ══ FONTES ══ -->

<div class="section fade-section">
<p class="section-label">Referências · Fontes de dados</p>

## Fontes

<div class="source-grid">

<div class="source-card">
<div class="s-label">Composição do índice</div>
<h4>B3 — Bolsa do Brasil</h4>
<p>API pública de composição do Ibovespa. Atualizada mensalmente. sistemaswebb3-listados.b3.com.br</p>
</div>

<div class="source-card">
<div class="s-label">Preços históricos</div>
<h4>Yahoo Finance</h4>
<p>OHLCV diário 2018–2025, ajustado por splits e dividendos. Acessado via biblioteca <code>yfinance</code>. Tickers no formato <code>XXXX.SA</code>.</p>
</div>

<div class="source-card">
<div class="s-label">Taxa de juros</div>
<h4>Banco Central do Brasil — SGS</h4>
<p>Série 432 (Meta Selic, % a.a.) e série 11 (Selic efetiva diária). API REST pública: api.bcb.gov.br</p>
</div>

<div class="source-card">
<div class="s-label">Decisões de política monetária</div>
<h4>COPOM — Banco Central</h4>
<p>Calendário e histórico de decisões do Comitê de Política Monetária, 2018–2025. bcb.gov.br/copom</p>
</div>

<div class="source-card">
<div class="s-label">Classificação setorial</div>
<h4>Yahoo Finance — yf.Ticker().info</h4>
<p>Campo <code>sector</code> e <code>industry</code> de cada ação. Usado como lookup para colorir e filtrar em todas as visualizações.</p>
</div>

<div class="source-card">
<div class="s-label">Algoritmos de rede</div>
<h4>NetworkX + python-louvain</h4>
<p>Detecção de comunidades via algoritmo de Louvain. Correlação de Pearson via pandas. Regressão OLS via statsmodels.</p>
</div>

</div>

<p style="margin-top:2rem;color:#475569;font-size:.78rem;">
  Código-fonte do pipeline disponível no notebook <code>ibovespa_pipeline.ipynb</code> · Visualizações em D3.js v7 via Observable Framework 1.13.4
</p>

</div>

<div class="fade-section" style="text-align:center;color:#475569;font-size:.75rem;padding:2rem 0 3rem;">
  Análise elaborada com dados do <strong style="color:#64748b;">Yahoo Finance</strong>, <strong style="color:#64748b;">B3</strong> e <strong style="color:#64748b;">Banco Central do Brasil</strong> · Período 2018–2025
</div>
