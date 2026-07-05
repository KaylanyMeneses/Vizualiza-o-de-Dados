---
title: Ibovespa · Correlação e Estrutura de Mercado
---

```js
import * as d3 from "npm:d3";
```

```js
const hMetrics = (await FileAttachment("data/h1_h2_network_metrics_quarterly.csv").csv({typed: true}))
  .map(d => ({...d, start: new Date(d.start), end: new Date(d.end)}))
const h3Beta       = await FileAttachment("data/h3_selic_beta_por_setor_enriched.csv").csv({typed: true})
const h3TickerYear = await FileAttachment("data/h3_selic_beta_por_ticker_year.csv").csv({typed: true})
const setores      = await FileAttachment("data/ibovespa_setores-1.csv").csv({typed: true})
const dfTS         = await FileAttachment("data/ibovespa_series_temporais.csv").csv({typed: true})
const correlationData = await FileAttachment("data/ibovespa_correlation_graph_quarterly.json").json()
```

```js
{
  const style = document.createElement("style")
  style.textContent = `
    /* ── fade-in scroll ── */
    .fade-section { opacity:0; transform:translateY(40px); transition:opacity .9s ease, transform .9s ease; }
    .fade-section.visible { opacity:1; transform:translateY(0); }

    /* ── layout narrativo lado-a-lado (apenas seções de história pré-transição) ── */
    .story-grid {
      display:grid; grid-template-columns:1fr 1fr; gap:3rem;
      align-items:center; padding:3.5rem 0; border-bottom:1px solid #1e293b;
    }
    .story-grid.flip > *:first-child { order:2; }
    .story-grid.flip > *:last-child  { order:1; }

    /* ── layout texto acima, viz abaixo (a partir da transição) ── */
    .story-stack { padding:3.5rem 0; border-bottom:1px solid #1e293b; }
    .story-stack .narr { max-width:720px; margin:0 auto 2.5rem; }
    .story-stack .viz  { max-width:920px; margin:0 auto; }

    /* ── texto narrativo ── */
    .narr h2 { font-size:1.45rem; font-weight:700; color:#f1f5f9; margin-bottom:.7rem; }
    .narr p  { color:#94a3b8; line-height:1.8; font-size:.93rem; margin-bottom:.6rem; }
    .narr .chip { display:inline-block; background:#1e3a5f; color:#93c5fd; font-size:.72rem;
                  padding:2px 9px; border-radius:99px; margin-bottom:.8rem; letter-spacing:.03em; }
    .narr .src  { color:#475569; font-size:.73rem; margin-top:.6rem; }

    /* ── hero ── */
    .hero-wrap { padding:5rem 0 2rem; }
    .hero-wrap h1 { font-size:2.2rem; font-weight:800; color:#f8fafc; line-height:1.25; }
    .hero-wrap .sub { color:#64748b; font-size:1rem; margin-top:.6rem; max-width:680px; line-height:1.7; }
    .hero-wrap .question { border-left:3px solid #3b82f6; padding-left:1rem; margin:1.8rem 0;
                           color:#93c5fd; font-size:1.05rem; font-style:italic; }
    .hyp-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:1rem; margin-top:1.5rem; }
    .hyp-card { background:#0f172a; border:1px solid #1e293b; border-radius:10px; padding:1rem 1.2rem; }
    .hyp-card .label { font-size:.72rem; color:#3b82f6; font-weight:700; letter-spacing:.05em; margin-bottom:.3rem; }
    .hyp-card p { font-size:.85rem; color:#94a3b8; line-height:1.6; margin:0; }

    /* ── misc ── */
    .divider { border:none; border-top:1px solid #1e293b; margin:1rem 0; }
    .section-title { font-size:.7rem; letter-spacing:.12em; text-transform:uppercase;
                     color:#475569; margin-bottom:2.5rem; }
    .transition-block { text-align:center; padding:4rem 0 2rem; }

    /* ── eixo X compacto ── */
    .x-tick-label { font-size:9px !important; }
  `
  document.head.appendChild(style)

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add("visible"); io.unobserve(e.target) } })
  }, {threshold:0.08})
  setTimeout(() => document.querySelectorAll(".fade-section").forEach(el => io.observe(el)), 200)
}
```

<!-- ══════════════ HERO ══════════════ -->

<div class="hero-wrap fade-section">

# Como o mercado brasileiro responde ao mundo?

<p class="sub">Entre 2018 e 2025, o Ibovespa atravessou a COVID-19, choques externos e ciclos agressivos de juros. Esta análise usa <strong>teoria dos grafos e correlações de retorno</strong> para revelar como as ações brasileiras se organizam — e como essa estrutura colapsa e se reconstrói ao longo do tempo.</p>

<div class="question">"Como eventos globais e nacionais alteram a estrutura de correlações entre ações brasileiras?"</div>

<div class="hyp-grid">
  <div class="hyp-card"><div class="label">H1 · Crises</div><p>Em períodos de pânico como a COVID-19, as correlações entre ações disparam — o mercado colapsa em bloco.</p></div>
  <div class="hyp-card"><div class="label">H2 · Recuperação</div><p>Após crises, setores se reorganizam e divergem novamente, restaurando a estrutura de rede.</p></div>
  <div class="hyp-card"><div class="label">H3 · Selic</div><p>Bancos e imobiliárias são mais sensíveis à taxa de juros do que commodities e exportadoras.</p></div>
  <div class="hyp-card"><div class="label">H4 · Comunidades</div><p>Algoritmos de detecção revelam agrupamentos que refletem — e às vezes transgridem — a classificação setorial.</p></div>
</div>
</div>

<hr class="divider"/>

<!-- ══════════════ HISTÓRIA 2 — SETORES ══════════════ -->

<div class="story-grid flip fade-section">
<div>

```js
{
  // Barras horizontais: nº de ações por setor — mesmas cores do grafo
  const setoresUnicos = [...new Set(setores.map(d=>d.sector).filter(Boolean))].sort()
  const palette = d3.scaleOrdinal(d3.schemeTableau10).domain(setoresUnicos)
  const contagem = d3.rollup(setores.filter(d=>d.sector), v=>v.length, d=>d.sector)
  const data = setoresUnicos.map(s=>({name:s, n:contagem.get(s)||0, color:palette(s)}))
    .sort((a,b)=>d3.descending(a.n,b.n))

  const rowH = 26, mL = 148, mR = 48, mT = 12, mB = 8
  const W = 480, H = data.length * rowH + mT + mB
  const svg = d3.create("svg").attr("viewBox",[0,0,W,H])
    .style("max-width","100%").style("font-family","system-ui,sans-serif")

  const x = d3.scaleLinear().domain([0, d3.max(data,d=>d.n)]).range([mL, W-mR])
  const y = d3.scaleBand().domain(data.map(d=>d.name)).range([mT, H-mB]).padding(0.28)

  // Gridlines verticais leves
  x.ticks(5).forEach(v => {
    svg.append("line")
      .attr("x1",x(v)).attr("x2",x(v)).attr("y1",mT).attr("y2",H-mB)
      .attr("stroke","#1e293b").attr("stroke-width",1)
  })

  // Barras
  svg.selectAll("rect").data(data).join("rect")
    .attr("x", mL)
    .attr("y", d=>y(d.name))
    .attr("width", d=>x(d.n)-mL)
    .attr("height", y.bandwidth())
    .attr("rx", 3)
    .attr("fill", d=>d.color)
    .attr("fill-opacity", 0.75)

  // Labels de setor (esquerda)
  svg.selectAll("text.lbl").data(data).join("text").attr("class","lbl")
    .attr("x", mL-6).attr("y", d=>y(d.name)+y.bandwidth()/2)
    .attr("dy","0.35em").attr("text-anchor","end")
    .attr("font-size",11).attr("fill",d=>d.color).attr("font-weight","500")
    .text(d=>d.name)

  // Valor (direita da barra)
  svg.selectAll("text.val").data(data).join("text").attr("class","val")
    .attr("x", d=>x(d.n)+5).attr("y", d=>y(d.name)+y.bandwidth()/2)
    .attr("dy","0.35em").attr("text-anchor","start")
    .attr("font-size",10).attr("fill","#64748b")
    .text(d=>d.n)

  display(svg.node())
}
```

</div>
<div class="narr">

<span class="chip">Composição</span>

## Um índice, muitos mundos

O Ibovespa não é homogêneo. Ele reúne empresas de setores completamente distintos — cada um com sua própria lógica e relação com o ciclo econômico.

**Financeiro** (Itaú, Bradesco, BTG) responde à taxa de juros e ao crédito. **Commodities** (Vale, Petrobras, Suzano) dançam ao ritmo do dólar e dos preços internacionais. **Consumo** (Ambev, Renner, Magalu) sente o pulso da renda doméstica.

Essa diversidade torna o Ibovespa um laboratório perfeito para estudar correlações: em condições normais, esses mundos se movem de forma independente. Mas quando a crise chega...

<p class="src">~80 ativos analisados · setores classificados pela B3</p>

</div>
</div>

<!-- ══════════════ HISTÓRIA 3 — SELIC ══════════════ -->

<div class="story-grid fade-section">
<div class="narr">

<span class="chip">Política Monetária</span>

## A Selic: a força invisível que move tudo

A **taxa Selic** é a taxa básica de juros da economia brasileira, definida pelo COPOM a cada 45 dias. Quando a Selic **sobe**, o crédito fica mais caro, empresas endividadas sofrem e o dinheiro migra da bolsa para a renda fixa.

Mas nem todos sofrem igual: **bancos** podem se beneficiar do spread; **commodities exportadoras** ficam relativamente protegidas; **imobiliárias e varejistas** são as mais afetadas.

Entre 2020 e 2022, o Brasil viveu um ciclo histórico: a Selic foi de **2% ao ano** (mínima histórica) para **13,75%**. Esse choque reconfigurou completamente quem ganhou e quem perdeu na bolsa.

<p class="src">Fonte: Banco Central do Brasil (SGS série 432) · COPOM 2018–2025</p>

</div>
<div>

```js
{
  // Dados reais da Selic COPOM 2018-2025 (valores históricos oficiais % a.a.)
  const selicData = [
    {date:new Date("2018-03-01"),v:6.5},{date:new Date("2018-06-01"),v:6.5},
    {date:new Date("2018-09-01"),v:6.5},{date:new Date("2018-12-01"),v:6.5},
    {date:new Date("2019-03-01"),v:6.5},{date:new Date("2019-06-01"),v:6.0},
    {date:new Date("2019-09-01"),v:5.5},{date:new Date("2019-12-01"),v:4.5},
    {date:new Date("2020-03-01"),v:3.75},{date:new Date("2020-06-01"),v:2.25},
    {date:new Date("2020-09-01"),v:2.0},{date:new Date("2020-12-01"),v:2.0},
    {date:new Date("2021-03-01"),v:2.75},{date:new Date("2021-06-01"),v:4.25},
    {date:new Date("2021-09-01"),v:6.25},{date:new Date("2021-12-01"),v:9.25},
    {date:new Date("2022-03-01"),v:11.75},{date:new Date("2022-06-01"),v:13.25},
    {date:new Date("2022-09-01"),v:13.75},{date:new Date("2022-12-01"),v:13.75},
    {date:new Date("2023-03-01"),v:13.75},{date:new Date("2023-06-01"),v:13.25},
    {date:new Date("2023-09-01"),v:12.75},{date:new Date("2023-12-01"),v:11.75},
    {date:new Date("2024-03-01"),v:10.75},{date:new Date("2024-06-01"),v:10.5},
    {date:new Date("2024-09-01"),v:10.75},{date:new Date("2024-12-01"),v:12.25},
    {date:new Date("2025-03-01"),v:14.75},{date:new Date("2025-06-01"),v:14.75}
  ]

  const W=500, H=300
  const svg = d3.create("svg").attr("viewBox",[0,0,W,H])
    .style("border-radius","12px").style("max-width","100%")
    .style("font-family","sans-serif")

  const xExt = d3.extent(selicData, d=>d.date)
  const x = d3.scaleTime().domain(xExt).range([55,W-20])
  const y = d3.scaleLinear().domain([0, d3.max(selicData,d=>d.v)*1.1]).range([H-35,25])

  ;[4,6,8,10,12,14].forEach(v => {
    svg.append("line").attr("x1",55).attr("x2",W-20).attr("y1",y(v)).attr("y2",y(v))
      .attr("stroke","#1e293b").attr("stroke-width",1)
    svg.append("text").attr("x",48).attr("y",y(v)+4).attr("text-anchor","end")
      .attr("font-size",8).attr("fill","#475569").text(v+"%")
  })

  const area = d3.area().x(d=>x(d.date)).y0(H-35).y1(d=>y(d.v)).curve(d3.curveStepAfter)
  svg.append("path").datum(selicData).attr("d",area).attr("fill","#f59e0b").attr("fill-opacity",0.12)
  const line = d3.line().x(d=>x(d.date)).y(d=>y(d.v)).curve(d3.curveStepAfter)
  svg.append("path").datum(selicData).attr("d",line).attr("fill","none").attr("stroke","#f59e0b").attr("stroke-width",2.2)

  const minPt = selicData.reduce((a,b)=>a.v<b.v?a:b)
  const maxPt = selicData.reduce((a,b)=>a.v>b.v?a:b)
  svg.append("text").attr("x",x(minPt.date)).attr("y",y(minPt.v)-10)
    .attr("text-anchor","middle").attr("font-size",8).attr("fill","#10b981").text(`mín. ${minPt.v}%`)
  svg.append("text").attr("x",x(maxPt.date)).attr("y",y(maxPt.v)-10)
    .attr("text-anchor","middle").attr("font-size",8).attr("fill","#f87171").text(`pico ${maxPt.v}%`)

  const anos = d3.timeYear.range(xExt[0], xExt[1])
  anos.forEach(a => {
    svg.append("text").attr("x",x(a)).attr("y",H-16)
      .attr("text-anchor","middle").attr("font-size",9).attr("fill","#475569").text(a.getFullYear())
  })
  svg.append("text").attr("x",W/2).attr("y",15)
    .attr("text-anchor","middle").attr("font-size",10).attr("fill","#64748b").attr("font-weight","600")
    .text("Meta Selic — COPOM (% a.a.)")

  display(svg.node())
}
```

</div>
</div>

<!-- ══════════════ TRANSIÇÃO ══════════════ -->

<div class="transition-block fade-section">
  <p style="color:#475569;font-size:.85rem;letter-spacing:.1em;text-transform:uppercase;text-align:center;">A investigação começa agora</p>
  <h2 style="font-size:2rem;font-weight:700;color:#f1f5f9;margin:.8rem auto;text-align:center;max-width:700px;line-height:1.3;">Com esse cenário em mente, partimos para os dados</h2>
  <p style="color:#94a3b8;max-width:600px;margin:.8rem auto 0;line-height:1.8;font-size:1rem;text-align:center;">
    Construímos redes de correlação com ~80 ativos do Ibovespa, aplicamos algoritmos de detecção de comunidades e regredimos retornos contra decisões do COPOM.
  </p>
</div>

<hr class="divider"/>

<!-- ══════════════ VISUALIZAÇÕES REAIS ══════════════ -->

<p class="section-title fade-section">Os dados · Visualizações interativas</p>

<!-- ── SÉRIES TEMPORAIS ── -->

<div class="story-stack fade-section">
<div class="narr">

<span class="chip">Ponto de partida</span>

## Séries temporais de retorno acumulado

O ponto de partida é olhar como cada ação se comportou ao longo do tempo. Setores inteiros se movem juntos — bancos sobem e caem em bloco, commodities respondem ao dólar. Isso levanta a pergunta central: quanto dessa co-movimentação é estrutural?

Clique em uma linha para destacar; clique no nome do setor na legenda para filtrar por setor; clique em qualquer área vazia para limpar a seleção.

<p class="src">Fonte: Yahoo Finance · Período 2018–2025 · Retorno acumulado sobre log-retornos diários</p>

</div>
<div class="viz">

```js
{
  const tickers    = [...new Set(dfTS.map(d=>d.ticker_clean))].sort()
  const sectorMap  = Object.fromEntries(setores.map(d=>[d.ticker_clean,d.sector]))
  const sectorList = [...new Set(tickers.map(t=>sectorMap[t]).filter(Boolean))].sort()
  const palette    = d3.scaleOrdinal(d3.schemeTableau10).domain(sectorList)

  const W=860, H=380, m={top:16,right:180,bottom:40,left:58}
  const svg = d3.create("svg").attr("viewBox",[0,0,W,H])
    .style("max-width","100%").style("font-family","system-ui,sans-serif")

  const byTicker = d3.group(dfTS.filter(d=>d.cumulative_return!=null), d=>d.ticker_clean)
  const x = d3.scaleTime()
    .domain(d3.extent(dfTS, d=>new Date(d.date)))
    .range([m.left, W-m.right])
  const y = d3.scaleLinear()
    .domain(d3.extent(dfTS.filter(d=>d.cumulative_return!=null), d=>+d.cumulative_return)).nice()
    .range([H-m.bottom, m.top])

  svg.append("g").attr("transform",`translate(0,${H-m.bottom})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d3.timeFormat("%b %Y")))
    .call(g=>g.selectAll("text").attr("fill","#94a3b8").style("font-size","10px")
      .attr("transform","rotate(-30)").style("text-anchor","end"))
    .call(g=>g.select(".domain").attr("stroke","#334155"))
  svg.append("g").attr("transform",`translate(${m.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(".0f")))
    .call(g=>g.selectAll("text").attr("fill","#94a3b8").style("font-size","10px"))
    .call(g=>g.select(".domain").attr("stroke","#334155"))
    .call(g=>g.selectAll(".tick line").clone().attr("x2",W-m.left-m.right).attr("stroke","#1e293b"))
  svg.append("line").attr("x1",m.left).attr("x2",W-m.right).attr("y1",y(0)).attr("y2",y(0))
    .attr("stroke","#475569").attr("stroke-dasharray","4,4")

  const line = d3.line().x(d=>x(new Date(d.date))).y(d=>y(+d.cumulative_return)).curve(d3.curveMonotoneX)
  let active = null
  const paths = {}
  for(const [ticker, values] of byTicker){
    const path = svg.append("path")
      .datum(values.sort((a,b)=>new Date(a.date)-new Date(b.date)))
      .attr("fill","none").attr("stroke",palette(sectorMap[ticker]))
      .attr("stroke-width",1.2).attr("opacity",0.6).style("cursor","pointer").attr("d",line)
      .on("click", function(){ active = active===ticker ? null : ticker; upd() })
    paths[ticker] = {path}
  }
  const lbl = svg.append("text").attr("x",m.left+8).attr("y",m.top+14)
    .attr("fill","#e2e8f0").attr("font-size",11).text("clique para destacar")

  function upd(){
    for(const [t,{path}] of Object.entries(paths)){
      if(!active) path.attr("opacity",0.6).attr("stroke-width",1.2)
      else if(t===active) path.attr("opacity",1).attr("stroke-width",2.5).raise()
      else path.attr("opacity",0.08).attr("stroke-width",1)
    }
    lbl.text(active ? `${active} · ${sectorMap[active]}` : "clique para destacar")
  }

  const leg = svg.append("g").attr("transform",`translate(${W-m.right+14},${m.top})`)
  sectorList.forEach((s,i) => {
    const g = leg.append("g").attr("transform",`translate(0,${i*22})`).style("cursor","pointer")
    g.append("line").attr("x1",0).attr("x2",16).attr("y1",0).attr("y2",0).attr("stroke",palette(s)).attr("stroke-width",2.5)
    g.append("text").attr("x",22).attr("y",4).attr("fill","#94a3b8").attr("font-size",10).text(s)
    g.on("click",()=>{
      const ins = Object.keys(paths).filter(t=>sectorMap[t]===s)
      for(const [t,{path}] of Object.entries(paths)){
        ins.includes(t) ? path.attr("opacity",1).attr("stroke-width",2).raise()
                        : path.attr("opacity",0.05).attr("stroke-width",1)
      }
      lbl.text(`setor: ${s}`)
    })
  })
  svg.on("click", e=>{ if(e.target.tagName!=="path"){ active=null; upd() } })
  display(svg.node())
}
```

</div>
</div>

<hr class="divider"/>

<!-- ── H1 — CORRELAÇÃO MÉDIA ── -->

<div class="story-stack fade-section">
<div class="narr">

<span class="chip">H1 · Crises</span>

## Quando o mercado entra em pânico, todos caem juntos

A **correlação média absoluta** da rede sobe dramaticamente em crises. Em 2020 (COVID-19), a correlação entre ativos atingiu níveis históricos: ações de setores completamente diferentes passaram a se mover como se fossem uma só.

Esse fenômeno — chamado de *colapso de correlação* — é a assinatura de um mercado em pânico. A diversificação deixa de funcionar exatamente quando mais se precisa dela.

Use o seletor abaixo para explorar outras métricas da rede: **densidade**, **número de arestas** e **tamanho do maior componente conectado**. Passe o mouse sobre os pontos para ver o valor exato de cada trimestre.

<p class="src">Fonte: Yahoo Finance · Janela trimestral · Correlação de Pearson sobre log-retornos</p>

</div>
<div class="viz">

```js
const selectedMetricH1 = view(Inputs.select(
  new Map([
    ["Correlação média absoluta", "avg_abs_corr"],
    ["Densidade da rede",         "density"],
    ["Número de arestas",         "n_edges"],
    ["Maior componente conectado","largest_component_share"]
  ]),
  { label: "Métrica", value: "avg_abs_corr" }
))
```

```js
{
  const data = hMetrics.map(d => ({...d, value: +d[selectedMetricH1]}))
  const W=860, H=340, m={top:24,right:24,bottom:80,left:68}
  const svg = d3.create("svg").attr("viewBox",[0,0,W,H])
    .style("max-width","100%").style("font-family","system-ui,sans-serif")
    .style("overflow","visible")

  const x = d3.scalePoint().domain(data.map(d=>d.period)).range([m.left,W-m.right]).padding(0.5)
  const y = d3.scaleLinear().domain(d3.extent(data,d=>d.value)).nice().range([H-m.bottom,m.top])

  // Gridlines verticais
  svg.selectAll("line.vg").data(data).join("line").attr("class","vg")
    .attr("x1",d=>x(d.period)).attr("x2",d=>x(d.period))
    .attr("y1",m.top).attr("y2",H-m.bottom)
    .attr("stroke","#94a3b8").attr("stroke-opacity",0.08)

  // Eixo X — labels abreviados e legíveis
  svg.append("g").attr("transform",`translate(0,${H-m.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d => {
      // "2020-Q1" → "Q1'20"
      const m2 = d.match(/(\d{4})[- ]?(Q\d)/)
      return m2 ? `${m2[2]}'${m2[1].slice(2)}` : d
    }))
    .call(g => g.selectAll("text")
      .attr("transform","rotate(-50)")
      .style("text-anchor","end")
      .style("font-size","9px")
      .attr("fill","#94a3b8")
      .attr("dy","0.32em")
      .attr("dx","-0.5em"))
    .call(g => g.select(".domain").attr("stroke","#334155"))

  // Eixo Y
  svg.append("g").attr("transform",`translate(${m.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(".3f")))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick text").attr("fill","#94a3b8").style("font-size","10px"))
    .call(g => g.selectAll(".tick line").clone().attr("x2",W-m.left-m.right).attr("stroke","#1e293b"))

  // Área + linha
  const area = d3.area().x(d=>x(d.period)).y0(H-m.bottom).y1(d=>y(d.value)).curve(d3.curveMonotoneX)
  svg.append("path").datum(data).attr("d",area).attr("fill","#3b82f6").attr("fill-opacity",0.08)
  svg.append("path").datum(data)
    .attr("fill","none").attr("stroke","#3b82f6").attr("stroke-width",2.2)
    .attr("d", d3.line().x(d=>x(d.period)).y(d=>y(d.value)).curve(d3.curveMonotoneX))

  // Pontos
  svg.selectAll("circle.pt").data(data).join("circle").attr("class","pt")
    .attr("cx",d=>x(d.period)).attr("cy",d=>y(d.value)).attr("r",4)
    .attr("fill","#3b82f6").attr("stroke","#0f172a").attr("stroke-width",1.5)

  // Tooltip inline no SVG
  const tt = svg.append("g").attr("display","none")
  tt.append("rect").attr("rx",4).attr("fill","#0f172a").attr("stroke","#334155").attr("stroke-width",1).attr("opacity",0.96)
  const ttL = [0,1,2].map(i => tt.append("text").attr("x",8).attr("y",16+i*14).attr("font-size",10).attr("fill","#e2e8f0"))

  svg.selectAll("circle.hz").data(data).join("circle").attr("class","hz")
    .attr("cx",d=>x(d.period)).attr("cy",d=>y(d.value)).attr("r",14).attr("fill","transparent").style("cursor","crosshair")
    .on("mouseover",(e,d) => {
      const cx=x(d.period), cy=y(d.value)
      const lines=[d.period, `valor: ${(+d.value).toFixed(4)}`, `arestas: ${d.n_edges}`]
      ttL.forEach((t,i)=>t.text(lines[i]||""))
      tt.select("rect").attr("width", d3.max(lines,l=>l.length)*6+16).attr("height",54)
      const flip = cx > W*0.7
      tt.attr("transform",`translate(${flip ? cx-d3.max(lines,l=>l.length)*6-24 : cx+8},${Math.max(4,cy-32)})`)
        .attr("display",null)
    })
    .on("mouseout",()=>tt.attr("display","none"))

  display(svg.node())
}
```

</div>
</div>

<hr class="divider"/>

<!-- ── H2 — MODULARIDADE ── -->

<div class="story-stack fade-section">
<div class="narr">

<span class="chip">H2 · Comunidades</span>

## A rede se reorganiza após a tempestade

Após crises, a **modularidade** da rede volta a subir — os setores se separam novamente. A NMI (Informação Mútua Normalizada) mede o quanto as comunidades detectadas coincidem com os setores reais da B3.

Quando a NMI é alta, o mercado "se comporta como esperado". Quando cai, surgem agrupamentos transversais — empresas de setores distintos que passam a se mover juntas por razões macroeconômicas. Clique nas métricas da legenda para mostrar/ocultar cada série.

<p class="src">Fonte: Yahoo Finance · Algoritmo de Louvain · Janela trimestral</p>

</div>
<div class="viz">

```js
{
  const allMetrics = ["Modularidade","NMI vs setor","Participação intra-setor"]
  const color = d3.scaleOrdinal().domain(allMetrics).range(["#2563eb","#ea580c","#16a34a"])
  const W=860, H=360, m={top:20,right:200,bottom:80,left:68}
  const svg = d3.create("svg").attr("viewBox",[0,0,W,H])
    .style("max-width","100%").style("font-family","system-ui,sans-serif")
    .style("overflow","visible")

  const allData = hMetrics.flatMap(d=>[
    {period:d.period, metric:"Modularidade",            value:+d.modularity},
    {period:d.period, metric:"NMI vs setor",            value:+d.nmi_sector},
    {period:d.period, metric:"Participação intra-setor",value:+d.intra_sector_share}
  ]).filter(d=>Number.isFinite(d.value))

  const periods = [...new Set(allData.map(d=>d.period))]
  const x = d3.scalePoint().domain(periods).range([m.left,W-m.right]).padding(0.5)
  const y = d3.scaleLinear().domain([0,1]).range([H-m.bottom,m.top])

  // Gridlines verticais
  svg.selectAll("line.vg").data(periods).join("line").attr("class","vg")
    .attr("x1",d=>x(d)).attr("x2",d=>x(d)).attr("y1",m.top).attr("y2",H-m.bottom)
    .attr("stroke","#94a3b8").attr("stroke-opacity",0.08)

  // Eixo X — labels abreviados e legíveis
  svg.append("g").attr("transform",`translate(0,${H-m.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d => {
      const mt = d.match(/(\d{4})[- ]?(Q\d)/)
      return mt ? `${mt[2]}'${mt[1].slice(2)}` : d
    }))
    .call(g => g.selectAll("text")
      .attr("transform","rotate(-50)")
      .style("text-anchor","end")
      .style("font-size","9px")
      .attr("fill","#94a3b8")
      .attr("dy","0.32em")
      .attr("dx","-0.5em"))
    .call(g => g.select(".domain").attr("stroke","#334155"))

  // Eixo Y
  svg.append("g").attr("transform",`translate(${m.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".1f")))
    .call(g=>g.select(".domain").remove())
    .call(g=>g.selectAll(".tick text").attr("fill","#94a3b8").style("font-size","10px"))
    .call(g=>g.selectAll(".tick line").clone().attr("x2",W-m.left-m.right).attr("stroke","#1e293b"))

  svg.append("text").attr("transform","rotate(-90)")
    .attr("x",-(m.top+(H-m.top-m.bottom)/2)).attr("y",16)
    .attr("text-anchor","middle").attr("font-size",11).attr("fill","#64748b").text("valor (0-1)")

  const line = d3.line().x(d=>x(d.period)).y(d=>y(d.value)).curve(d3.curveMonotoneX)
  const grouped = d3.group(allData,d=>d.metric)
  const mg = {}
  for(const [metric, values] of grouped){
    const g = svg.append("g")
    g.append("path").datum(values).attr("fill","none").attr("stroke",color(metric)).attr("stroke-width",2.2).attr("d",line)
    g.selectAll("circle").data(values).join("circle")
      .attr("cx",d=>x(d.period)).attr("cy",d=>y(d.value)).attr("r",3.5)
      .attr("fill",color(metric)).attr("stroke","#0f172a").attr("stroke-width",1)
    mg[metric] = g
  }

  // Legenda clicável
  const leg = svg.append("g").attr("transform",`translate(${W-m.right+16},${m.top+10})`)
  allMetrics.forEach((metric,i) => {
    const g = leg.append("g").attr("transform",`translate(0,${i*28})`).style("cursor","pointer")
    g.append("line").attr("x1",0).attr("x2",18).attr("y1",0).attr("y2",0).attr("stroke",color(metric)).attr("stroke-width",2.5)
    g.append("circle").attr("cx",9).attr("cy",0).attr("r",3.5).attr("fill",color(metric)).attr("stroke","white").attr("stroke-width",1)
    const lbl = g.append("text").attr("x",26).attr("y",4).attr("font-size",11).attr("fill",color(metric)).text(metric)
    let on = true
    g.on("click",()=>{ on=!on; mg[metric].style("opacity",on?1:0.1); lbl.attr("fill",on?color(metric):"#475569") })
  })

  display(svg.node())
}
```

</div>
</div>

<hr class="divider"/>

<!-- ── H3 — BARRAS ── -->

<div class="story-stack fade-section">
<div class="narr">

<span class="chip">H3 · Selic</span>

## Quem ganha e quem perde com os juros?

Regredimos os retornos de cada setor contra a variação da Selic e estimamos um **beta de sensibilidade**. Confirmando H3: o setor financeiro lidera em sensibilidade positiva, enquanto consumo discricionário e tecnologia apresentam beta negativo — exatamente o padrão esperado.

Beta positivo = o setor tende a se beneficiar quando a Selic sobe. Beta negativo = o setor sofre com alta de juros. Clique em uma barra para destacar.

<p class="src">Fonte: Yahoo Finance + Banco Central · COPOM 2018–2025</p>

</div>
<div class="viz">

```js
{
  const data = [...h3Beta].sort((a,b)=>d3.ascending(+a.beta,+b.beta))
  const W=860, rowH=30, H=Math.max(340,data.length*rowH+80), m={top:24,right:24,bottom:52,left:220}
  const svg = d3.create("svg").attr("viewBox",[0,0,W,H])
    .style("max-width","100%").style("font-family","system-ui,sans-serif")

  const xMin = d3.min(data,d=>Math.min(0,+d.beta))*1.2
  const xMax = (d3.max(data,d=>Math.max(0,+d.beta))*1.2)||0.5
  const x = d3.scaleLinear().domain([xMin,xMax]).nice().range([m.left,W-m.right])
  const y = d3.scaleBand().domain(data.map(d=>d.sector)).range([m.top,H-m.bottom]).padding(0.25)

  svg.append("g").attr("transform",`translate(0,${H-m.bottom+12})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format(".1f")))
    .call(g=>g.select(".domain").attr("stroke","#334155"))
    .call(g=>g.selectAll("text").attr("fill","#94a3b8").style("font-size","10px"))
  svg.append("g").attr("transform",`translate(${m.left},0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .call(g=>g.select(".domain").remove())
    .call(g=>g.selectAll(".tick text").style("font-size","11px").attr("fill","#e2e8f0"))

  svg.append("line").attr("x1",x(0)).attr("x2",x(0)).attr("y1",m.top).attr("y2",H-m.bottom+12)
    .attr("stroke","#64748b").attr("stroke-dasharray","4,4")

  let aS = null
  const bars = svg.selectAll("rect.bar").data(data).join("rect").attr("class","bar")
    .attr("x",d=>x(Math.min(0,+d.beta))).attr("y",d=>y(d.sector))
    .attr("width",d=>Math.abs(x(+d.beta)-x(0))).attr("height",y.bandwidth())
    .attr("rx",3).attr("fill",d=>+d.beta>=0?"#2563eb":"#dc2626").style("cursor","pointer")
    .on("click",function(e,d){ aS=aS===d.sector?null:d.sector; bars.style("opacity",b=>aS===null||b.sector===aS?1:0.25) })
  bars.append("title").text(d=>`${d.sector}\nβ=${(+d.beta).toFixed(3)}\np=${(+d.pvalue).toFixed(3)}`)

  svg.selectAll("text.val").data(data).join("text").attr("class","val")
    .attr("x",d=>x(+d.beta)+(+d.beta>=0?5:-5)).attr("y",d=>y(d.sector)+y.bandwidth()/2)
    .attr("dy","0.35em").attr("text-anchor",d=>+d.beta>=0?"start":"end")
    .attr("font-size",10).attr("fill","#94a3b8").text(d=>(+d.beta).toFixed(2))

  svg.append("text").attr("x",(m.left+W-m.right)/2).attr("y",H-6)
    .attr("text-anchor","middle").attr("font-size",11).attr("fill","#64748b")
    .text("β  (sensibilidade ao retorno da Selic)")

  display(svg.node())
}
```

</div>
</div>

<hr class="divider"/>

<!-- ── H3 — RADIAL ── -->

<div class="story-stack fade-section">
<div class="narr">

<span class="chip">H3 · Ticker a ticker</span>

<div class="story-stack fade-section">
<div class="narr">

<span class="chip">H3 · Ticker a ticker</span>

## Dentro de cada setor, há heterogeneidade

A visão agregada por setor esconde diferenças importantes. A árvore radial desce ao nível do **ticker individual**, classificando cada ação em três faixas de sensibilidade à Selic.

Clique nos grupos internos (♦ Mais sensível / ▪ Intermediário / ● Menos sensível) para filtrar. Use os arcos externos para navegar entre anos e ver como a sensibilidade evolui a cada ciclo do COPOM.

<p class="src">Fonte: Yahoo Finance + COPOM · Beta em janela de 30 dias pós-decisão</p>

</div>
<div class="viz">

```js
{
  const anos = [...new Set(h3TickerYear.map(d=>+d.year))].sort(d3.ascending)
  let anoAtual = anos.includes(2022) ? 2022 : anos[0], grupoSelecionado = null
  const W=680, H=680, radioArvore=240, radioArco=330, radioArcoIn=298
  const DURACAO = 2400
  const GRUPOS = ["Mais sensível","Intermediário","Menos sensível"]
  const GRUPO_SHAPE = {"Mais sensível":"diamond","Intermediário":"rect","Menos sensível":"circle"}
  const SHAPE_FILL="#334155", SHAPE_STROKE="#cbd5e1"
  const sectorPalette=["#4E79A7","#F28E2B","#E15759","#76B7B2","#59A14F","#EDC948","#B07AA1","#FF9DA7","#9C755F","#BAB0AC","#2D6CDF","#D37295"]
  const base = h3TickerYear
  const setoresVis = [...new Set(base.map(d=>d.sector).filter(Boolean))].sort()
  const sectorColor = d3.scaleOrdinal().domain(setoresVis).range(sectorPalette)

  function buildHierarchy(dados){
    const map = d3.group(dados.filter(d=>isFinite(+d.beta_selic_30d)), d=>d.beta_band||"Intermediário")
    return {name:"Selic", children: GRUPOS.filter(g=>map.has(g)).map(g=>({
      name: g, children: map.get(g).sort((a,b)=>d3.ascending(a.sector,b.sector)).map(d=>({
        name:d.ticker_clean, sector:d.sector, value:Math.abs(+d.beta_selic_30d)||0.05,
        beta:+d.beta_selic_30d, pvalue:+d.pvalue, r2:+d.r2,
        median_return_30d:+d.median_return_30d_after_copom, volatility:+d.avg_volatility_20d,
        drawdown:+d.max_drawdown_pct, significant:d.significant
      }))
    }))}
  }

  function pos(d){ return `rotate(${d.x*180/Math.PI-90}) translate(${d.y},0)` }
  function parentPos(d){ const p=d.parent||d; return `rotate(${(p?.x??d.x)*180/Math.PI-90}) translate(${p?.y??d.y},0)` }

  const svg = d3.create("svg")
    .attr("viewBox",[-W/2,-H/2,W,H])
    .style("font-family","sans-serif")
    .style("user-select","none")
    .style("display","block")
    .style("margin","0 auto")
    .style("max-width","680px")

  const gYears=svg.append("g"), gLinks=svg.append("g"), gNodes=svg.append("g")
  const segW=(2*Math.PI)/anos.length
  const angleScale = d3.scalePoint().domain(anos.map(String)).range([0,2*Math.PI]).padding(0.5)
  const arcGen = d3.arc().innerRadius(radioArcoIn).outerRadius(radioArco).cornerRadius(4)

  gYears.selectAll("path.arco").data(anos).join("path").attr("class","arco")
    .attr("d",d=>arcGen({startAngle:angleScale(String(d))-segW*0.45, endAngle:angleScale(String(d))+segW*0.45}))
    .attr("fill",d=>d===anoAtual?"#475569":"#334155")
    .attr("stroke",d=>d===anoAtual?"#e2e8f0":"#0d1117")
    .attr("stroke-width",d=>d===anoAtual?2.2:2)
    .style("cursor","pointer")
    .on("click",function(e,d){ anoAtual=d; update() })

  gYears.selectAll("text.ano-label").data(anos).join("text").attr("class","ano-label")
    .attr("transform",d=>{
      const a=angleScale(String(d))-Math.PI/2
      const r=(radioArcoIn+radioArco)/2
      return `translate(${r*Math.cos(a)},${r*Math.sin(a)})`
    })
    .attr("text-anchor","middle").attr("dominant-baseline","middle")
    .attr("font-size",14).attr("font-weight",d=>d===anoAtual?"700":"500")
    .attr("fill","#e5e7eb").attr("pointer-events","none").text(d=>d)

  const tooltip = svg.append("g").attr("display","none").style("pointer-events","none")
  tooltip.append("rect").attr("rx",6).attr("fill","#1e293b").attr("stroke","#94a3b8").attr("stroke-width",1).attr("opacity",0.97)
  const ttLines = d3.range(7).map(i=>tooltip.append("text").attr("x",10).attr("y",18+i*16).attr("font-size",15).attr("fill","#e5e7eb"))

  function update(){
    const dados = base.filter(d=>+d.year===anoAtual)
    const root = d3.hierarchy(buildHierarchy(dados)).sum(d=>d.value||0).sort((a,b)=>b.value-a.value)
    d3.cluster().size([2*Math.PI,radioArvore])(root)
    const t = svg.transition().duration(DURACAO).ease(d3.easeCubicInOut)

    gYears.selectAll("path.arco").transition(t)
      .attr("fill",d=>d===anoAtual?"#475569":"#334155")
      .attr("stroke",d=>d===anoAtual?"#e2e8f0":"#0d1117")
    gYears.selectAll("text.ano-label").transition(t)
      .attr("font-weight",d=>d===anoAtual?"700":"500")

    const radialLink = d3.linkRadial().angle(d=>d.x).radius(d=>d.y)

    gLinks.selectAll("path.link")
      .data(root.links(), d=>`${d.source.data.name}->${d.target.data.name}`)
      .join(
        enter => enter.append("path").attr("class","link")
          .attr("fill","none").attr("stroke","#29405c").attr("stroke-width",0.8)
          .attr("opacity",0).attr("d",radialLink)
          .call(e=>e.transition(t).attr("opacity",1).attr("d",radialLink)),
        upd => upd.call(u=>u.transition(t)
          .attr("opacity",d=>!grupoSelecionado?1:(d.source.data.name===grupoSelecionado||d.target.parent?.data?.name===grupoSelecionado)?1:0.06)
          .attr("d",radialLink)),
        exit => exit.call(e=>e.transition(t).attr("opacity",0).remove())
      )

    gNodes.selectAll("g.node")
      .data(root.descendants(), d=>`${d.depth}-${d.data.name}`)
      .join(
        enter => {
          const g = enter.append("g").attr("class","node")
            .attr("transform",d=>parentPos(d)).attr("opacity",0)
          g.each(function(d){
            const s=d3.select(this)
            if(d.depth===0) s.append("circle")
            else if(d.depth===1){
              const sh=GRUPO_SHAPE[d.data.name]||"circle"
              if(sh==="circle") s.append("circle")
              else if(sh==="rect") s.append("rect")
              else s.append("polygon")
            }
            else s.append("circle")
          })
          g.append("text")
          return g.call(e=>e.transition(t).attr("opacity",1).attr("transform",d=>pos(d)))
        },
        upd => upd.call(u=>u.transition(t)
          .attr("transform",d=>pos(d))
          .attr("opacity",d=>!grupoSelecionado?1:(
            d.depth===0||(d.depth===1&&d.data.name===grupoSelecionado)||(d.depth===2&&d.parent.data.name===grupoSelecionado)
          )?1:0.06)),
        exit => exit.call(e=>e.transition(t).attr("opacity",0).attr("transform",d=>parentPos(d)).remove())
      )
      .style("cursor",d=>d.depth>=1?"pointer":"default")
      .call(node=>{
        node.select("circle").transition(t)
          .attr("r",d=>d.depth===0?5:d.depth===2?5:7)
          .attr("fill",d=>d.depth===2?sectorColor(d.data.sector):d.depth===0?"#94a3b8":SHAPE_FILL)
          .attr("stroke",d=>d.depth===2?d3.color(sectorColor(d.data.sector)).darker(0.8).toString():SHAPE_STROKE)
          .attr("stroke-width",d=>d.depth===1?1.8:0.8)
          .attr("opacity",d=>d.depth===2?(d.data.significant==="True"||d.data.significant===true?0.98:0.6):1)

        node.select("rect").transition(t)
          .attr("x",-6).attr("y",-6).attr("width",12).attr("height",12)
          .attr("fill",SHAPE_FILL).attr("stroke",SHAPE_STROKE).attr("stroke-width",1.2)

        node.select("polygon").transition(t)
          .attr("points","0,-8 8,0 0,8 -8,0")
          .attr("fill",SHAPE_FILL).attr("stroke",SHAPE_STROKE).attr("stroke-width",1.2)

        node.select("text").transition(t)
          .attr("dy","0.32em")
          .attr("x",d=>d.x<Math.PI===!d.children?12:-12)
          .attr("text-anchor",d=>d.x<Math.PI===!d.children?"start":"end")
          .attr("transform",d=>d.x>=Math.PI?"rotate(180)":null)
          .attr("font-size",d=>d.depth===1?12:9)
          .attr("font-weight",d=>d.depth<2?"700":"400")
          .attr("fill",d=>d.depth===1?"#e2e8f0":d.depth===2?"#cbd5e1":"#94a3b8")
          .text(d=>d.data.name)

        node.filter(d=>d.depth===1)
          .on("click",function(e,d){
            grupoSelecionado=grupoSelecionado===d.data.name?null:d.data.name
            update()
          })

        node.filter(d=>d.depth===2)
          .on("mouseover",function(e,d){
            const lines=[
              d.data.name,
              `Setor: ${d.data.sector||"Outros"}`,
              `Grupo: ${d.parent.data.name}`,
              `β: ${d.data.beta?.toFixed(3)}`,
              `p: ${d.data.pvalue?.toFixed(3)}  R²: ${d.data.r2?.toFixed(3)}`,
              `Ret 30d: ${d.data.median_return_30d?.toFixed(2)}%`,
              `Vol: ${d.data.volatility?.toFixed(2)}`
            ]
            ttLines.forEach((t,i)=>{ t.text(lines[i]||""); t.attr("font-weight",i===0?"700":"400") })
            tooltip.select("rect")
              .attr("width",d3.max(lines,l=>l.length)*6.5)
              .attr("height",16*lines.length+12)
            const angle=d.x-Math.PI/2
            tooltip.attr("transform",`translate(${d.y*Math.cos(angle)+16},${d.y*Math.sin(angle)-16})`).attr("display",null)
          })
          .on("mouseout",()=>tooltip.attr("display","none"))
      })
  }

  update()
  display(svg.node())
}
```

</div>
</div>

<hr class="divider"/>

<!-- ── H4 — REDE DE CORRELAÇÃO ── -->

<div class="story-stack fade-section">
<div class="narr">

<span class="chip">H4 · Visão completa</span>

## A rede que conecta tudo

Esta é a visualização central: a **rede de correlação** completa. Cada nó é um ativo do Ibovespa, colorido por setor. As arestas representam correlações acima do limiar (|r| ≥ 0.6).

Use o **slider** para navegar entre períodos históricos. Nos períodos de crise, a rede se densifica — todos convergem. Nos períodos de calma, emergem **clusters setoriais** bem definidos, confirmando H4. Clique num nó para destacar suas conexões; arraste para reposicionar; scroll para zoom.

<p class="src">Fonte: Yahoo Finance · Correlação de Pearson · Janela de 63 dias úteis</p>

</div>
<div class="viz">

```js
{
  const W=860, H=520

  function buildSectorMap(rows){
    const map=new Map()
    for(const row of rows){
      const sector=row.sector||"Outros"
      ;[row.ticker_yf,row.ticker,row.ticker_clean,row.symbol].filter(Boolean).forEach(k=>map.set(k,sector))
      if(row.ticker_clean) map.set(`${row.ticker_clean}.SA`,sector)
    }
    return map
  }
  const setorMap = buildSectorMap(setores)
  function resolveSector(d){
    const keys=[d.id,d.ticker_yf,d.ticker,d.ticker_clean,d.symbol].filter(Boolean)
    if(d.ticker_clean) keys.push(`${d.ticker_clean}.SA`)
    for(const k of keys){ if(setorMap.has(k)) return setorMap.get(k) }
    return "Outros"
  }
  function clusterForce(strength){
    let _n
    function force(alpha){
      const by=d3.group(_n,d=>d.sector)
      const centers=new Map([...by].map(([s,m])=>[s,{x:d3.mean(m,d=>d.x),y:d3.mean(m,d=>d.y)}]))
      for(const d of _n){ const c=centers.get(d.sector); if(!c)continue; d.vx+=(c.x-d.x)*strength*alpha; d.vy+=(c.y-d.y)*strength*alpha }
    }
    force.initialize=ns=>{_n=ns}
    return force
  }

  const positions=new Map(); let selected=null, currentSim=null, currentNodes=[], dragged=false
  const container=document.createElement("div")
  container.style.cssText="padding:4px 0;font-family:sans-serif;"
  container.innerHTML=`<div style="margin-bottom:8px;"><span style="color:#e5e7eb;font-size:14px;font-weight:700;">Rede de correlação por período</span><br><span style="color:#94a3b8;font-size:11px;">Clique num nó · Arraste · Scroll para zoom</span></div>`

  const svgEl=d3.create("svg").attr("viewBox",[0,0,W,H])
    .style("display","block").style("max-width","100%").style("height","auto")
    .style("border-radius","10px")
  container.appendChild(svgEl.node())

  const ctrl=document.createElement("div"); ctrl.style.cssText="margin-top:8px;"
  ctrl.innerHTML=`<div style="display:flex;align-items:center;gap:10px;"><span style="color:#94a3b8;font-size:11px;white-space:nowrap;">Período</span><input type="range" min="0" max="${correlationData.length-1}" step="1" value="0" style="flex:1;" id="sr_main"><span id="pn_main" style="color:#e5e7eb;font-size:11px;min-width:240px;text-align:right;"></span></div>`
  container.appendChild(ctrl)

  const slider=ctrl.querySelector("#sr_main"), periodName=ctrl.querySelector("#pn_main")
  const root=d3.select(svgEl.node())
  const defs=root.append("defs")
  const glow=defs.append("filter").attr("id","ng_m").attr("x","-40%").attr("y","-40%").attr("width","180%").attr("height","180%")
  glow.append("feGaussianBlur").attr("stdDeviation","2").attr("result","blur")
  glow.append("feMerge").selectAll("feMergeNode").data(["blur","SourceGraphic"]).join("feMergeNode").attr("in",d=>d)
  const zoomG=root.append("g")
  root.call(d3.zoom().scaleExtent([0.3,8]).on("zoom",e=>zoomG.attr("transform",e.transform)))

  function savePos(nodes){ for(const n of nodes) positions.set(n.id,{x:n.x,y:n.y,vx:n.vx,vy:n.vy}) }

  function render(index){
    if(currentNodes.length) savePos(currentNodes)
    if(currentSim) currentSim.stop()
    zoomG.selectAll("*").remove()
    const period=correlationData[index]
    periodName.textContent=`${period.period}  ·  ${period.start} → ${period.end}  ·  ${period.n_edges} arestas`
    const nodes=period.nodes.map(d=>{
      const prev=positions.get(d.id)
      return{...d, sector:resolveSector(d), x:prev?.x??W/2+(Math.random()-0.5)*40, y:prev?.y??H/2+(Math.random()-0.5)*40, vx:prev?.vx??0, vy:prev?.vy??0}
    })
    currentNodes=nodes
    const nodeSet=new Set(nodes.map(d=>d.id))
    const links=period.edges.filter(d=>nodeSet.has(d.source)&&nodeSet.has(d.target)).map(d=>({...d}))
    const sectors=[...new Set(nodes.map(d=>d.sector))].sort()
    const color=d3.scaleOrdinal(d3.schemeTableau10).domain(sectors)
    const sizeScale=d3.scaleSqrt().domain(d3.extent(nodes,d=>d.avg_volume)).range([5,16])
    const widthScale=d3.scaleLinear().domain([0.5,1]).range([0.6,4])
    const adj=new Map(nodes.map(n=>[n.id,new Set()]))
    links.forEach(l=>{ const s=l.source?.id??l.source, t=l.target?.id??l.target; adj.get(s)?.add(t); adj.get(t)?.add(s) })

    const ll=zoomG.append("g"), nl=zoomG.append("g"), tl=zoomG.append("g")
    const linkG=ll.selectAll("line").data(links).join("line")
      .attr("stroke","#6699bb").attr("stroke-opacity",d=>0.12+d.weight*0.28).attr("stroke-width",d=>widthScale(d.weight))
    const nodeG=nl.selectAll("g").data(nodes,d=>d.id).join("g").style("cursor","pointer")
    const circles=nodeG.append("circle")
      .attr("r",d=>sizeScale(d.avg_volume)).attr("fill",d=>color(d.sector))
      .attr("fill-opacity",0.85).attr("stroke",d=>d3.color(color(d.sector)).darker(0.8).toString()).attr("stroke-width",1.2)
    const texts=tl.selectAll("text").data(nodes,d=>d.id).join("text").text(d=>d.ticker_clean)
      .attr("font-size",d=>Math.max(5.5,Math.min(sizeScale(d.avg_volume)*0.72,10)))
      .attr("font-weight",600).attr("fill","#ffffff").attr("text-anchor","middle").attr("dominant-baseline","middle")
      .attr("pointer-events","none").attr("stroke","#000").attr("stroke-width",2.2).attr("paint-order","stroke")

    function updateStyles(){
      const conn=selected?(adj.get(selected)??new Set()):null
      linkG.attr("stroke",l=>{ if(!selected)return"#6699bb"; const s=l.source?.id??l.source,t=l.target?.id??l.target; return s===selected||t===selected?"#ff6b6b":"#6699bb" })
        .attr("stroke-opacity",l=>{ if(!selected)return 0.12+l.weight*0.28; const s=l.source?.id??l.source,t=l.target?.id??l.target; return s===selected||t===selected?0.95:0.03 })
      circles.attr("fill-opacity",n=>!selected?0.85:n.id===selected||conn.has(n.id)?1:0.1)
        .attr("stroke",n=>{ if(!selected)return d3.color(color(n.sector)).darker(0.8).toString(); if(n.id===selected)return"#ffffff"; if(conn.has(n.id))return"#ffcc00"; return d3.color(color(n.sector)).darker(0.8).toString() })
        .attr("filter",n=>selected&&n.id===selected?"url(#ng_m)":null)
      texts.attr("opacity",n=>!selected?1:n.id===selected||conn.has(n.id)?1:0.3)
        .attr("fill",n=>!selected?"#ffffff":n.id===selected?"#ffffff":conn.has(n.id)?"#ffcc00":"#aaa")
    }

    currentSim=d3.forceSimulation(nodes).alpha(0.18).alphaMin(0.001).alphaDecay(0.0018).velocityDecay(0.65)
      .force("link",d3.forceLink(links).id(d=>d.id).distance(60).strength(d=>d.weight*0.38))
      .force("charge",d3.forceManyBody().strength(-90))
      .force("center",d3.forceCenter(W/2,H/2))
      .force("collide",d3.forceCollide(d=>sizeScale(d.avg_volume)+4))
      .force("cluster",clusterForce(0.16))
    nodeG.call(d3.drag()
      .on("start",(e,d)=>{ dragged=false; if(!e.active)currentSim.alphaTarget(0.05).restart(); d.fx=d.x; d.fy=d.y })
      .on("drag",(e,d)=>{ dragged=true; d.fx=e.x; d.fy=e.y })
      .on("end",(e,d)=>{ if(!e.active)currentSim.alphaTarget(0); d.fx=null; d.fy=null }))
    nodeG.on("click",(e,d)=>{ e.stopPropagation(); if(dragged)return; selected=selected===d.id?null:d.id; updateStyles() })
    root.on("click",()=>{ selected=null; updateStyles() })
    currentSim.on("tick",()=>{
      linkG.attr("x1",d=>d.source.x).attr("y1",d=>d.source.y).attr("x2",d=>d.target.x).attr("y2",d=>d.target.y)
      nodeG.attr("transform",d=>`translate(${d.x},${d.y})`)
      texts.attr("x",d=>d.x).attr("y",d=>d.y)
    })
    updateStyles()
  }

  slider.addEventListener("input",e=>render(+e.target.value))
  render(0)
  display(container)
}
```

</div>
</div>

<hr class="divider"/>

<div class="fade-section" style="text-align:center;color:#475569;font-size:.78rem;padding:2.5rem 0 3rem;">
  Análise elaborada com dados do <strong style="color:#64748b;">Yahoo Finance</strong> e do <strong style="color:#64748b;">Banco Central do Brasil</strong> · Período 2018–2025
</div>


