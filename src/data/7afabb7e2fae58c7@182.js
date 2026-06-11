import define1 from "./6705012ea4863d3f@291.js";
import define2 from "./3c458cfcac4dbda8@560.js";

function _1(md){return(
md`# Untitled`
)}

function _d3(require){return(
require("d3@7")
)}

async function _dfTS(FileAttachment){return(
await FileAttachment("ibovespa_series_temporais.csv").csv({typed: true})
)}

async function _hMetrics(FileAttachment){return(
(await FileAttachment("h1_h2_network_metrics_quarterly.csv")
  .csv({typed: true}))
  .map(d => ({
    ...d,
    start: new Date(d.start),
    end: new Date(d.end)
  }))
)}

async function _hMetricsThematic(FileAttachment){return(
(await FileAttachment("h1_h2_network_metrics_thematic.csv")
  .csv({typed: true}))
  .map(d => ({
    ...d,
    start: new Date(d.start),
    end: new Date(d.end)
  }))
)}

async function _h3Beta(FileAttachment){return(
await FileAttachment("h3_selic_beta_por_setor_enriched.csv")
  .csv({typed: true})
)}

async function _h3TickerYear(FileAttachment){return(
await FileAttachment("h3_selic_beta_por_ticker_year.csv")
  .csv({typed: true})
)}

function _8(setores){return(
setores[0]
)}

function _setores(FileAttachment){return(
FileAttachment("ibovespa_setores-1.csv").csv({typed: true})
)}

function _allSectors(setores){return(
[...new Set(setores.map(d => d.sector).filter(Boolean))].sort()
)}

function _selectedSectors(Inputs,allSectors){return(
Inputs.checkbox(allSectors, {
  label: "Filtrar setores",
  value: allSectors
})
)}

function _periodIndex(){return(
0
)}

function _data(FileAttachment){return(
FileAttachment("ibovespa_correlation_graph_quarterly.json").json()
)}

function _15(globalThis,periodIndex,data,setores,d3,html,selectedSectors,invalidation)
{
  const W = 860, H = 560;

  const state = globalThis.__graphStateEmbeddedSlow ??= {
    positions: new Map(),
    selected: null,
    index: 0
  };

  const initialIndex =
    typeof periodIndex !== "undefined"
      ? Math.max(0, Math.min(data.length - 1, periodIndex))
      : Math.max(0, Math.min(data.length - 1, state.index || 0));

  state.index = initialIndex;

  function buildSectorMap(rows) {
    const map = new Map();
    for (const row of rows) {
      const sector = row.sector || "Outros";
      [row.ticker_yf, row.ticker, row.ticker_clean, row.symbol]
        .filter(Boolean)
        .forEach(key => map.set(key, sector));
      if (row.ticker_clean) map.set(`${row.ticker_clean}.SA`, sector);
    }
    return map;
  }

  const setorMap = buildSectorMap(setores);

  function resolveSector(d) {
    const keys = [d.id, d.ticker_yf, d.ticker, d.ticker_clean, d.symbol].filter(Boolean);
    if (d.ticker_clean) keys.push(`${d.ticker_clean}.SA`);
    for (const key of keys) {
      if (setorMap.has(key)) return setorMap.get(key);
    }
    return "Outros";
  }

  function clusterForce(strength) {
    let _n;
    function force(alpha) {
      const bySector = d3.group(_n, d => d.sector);
      const centers = new Map(
        [...bySector].map(([sector, members]) => [
          sector,
          {
            x: d3.mean(members, d => d.x),
            y: d3.mean(members, d => d.y)
          }
        ])
      );
      for (const d of _n) {
        const c = centers.get(d.sector);
        if (!c) continue;
        d.vx += (c.x - d.x) * strength * alpha;
        d.vy += (c.y - d.y) * strength * alpha;
      }
    }
    force.initialize = ns => { _n = ns; };
    return force;
  }

  const container = html`<div style="
    max-width: 900px;
    background: #0d1117;
    border-radius: 12px;
    padding: 12px 12px 14px 12px;
    font-family: sans-serif;
  "></div>`;

  const top = html`<div style="
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:12px;
    margin-bottom:8px;
  ">
    <div>
      <div style="color:#e5e7eb;font-size:16px;font-weight:700;">Rede de correlação por setor</div>
      <div style="color:#94a3b8;font-size:12px;margin-top:2px;">Clique em um nó para destacar conexões. Arraste para reposicionar.</div>
    </div>
  </div>`;

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, W, H])
    .style("display", "block")
    .style("max-width", "100%")
    .style("height", "auto")
    .style("background", "#0b1220")
    .style("border-radius", "10px");

  const controls = html`<div style="margin-top:10px;">
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="color:#94a3b8;font-size:12px;white-space:nowrap;">Período</span>
      <input id="period-slider" type="range" min="0" max="${data.length - 1}" step="1" value="${initialIndex}" style="flex:1;" />
      <span id="period-name" style="color:#e5e7eb;font-size:12px;min-width:220px;text-align:right;"></span>
    </div>
  </div>`;

  container.append(top, svg.node(), controls);

  const slider = controls.querySelector("#period-slider");
  const periodName = controls.querySelector("#period-name");

  const root = d3.select(svg.node());

  const defs = root.append("defs");

  const glow = defs.append("filter")
    .attr("id", "node-glow")
    .attr("x", "-40%")
    .attr("y", "-40%")
    .attr("width", "180%")
    .attr("height", "180%");

  glow.append("feGaussianBlur")
    .attr("stdDeviation", "2")
    .attr("result", "blur");

  glow.append("feMerge")
    .selectAll("feMergeNode")
    .data(["blur", "SourceGraphic"])
    .join("feMergeNode")
    .attr("in", d => d);

  const zoomG = root.append("g");

  root.call(
    d3.zoom()
      .scaleExtent([0.35, 6])
      .on("zoom", e => zoomG.attr("transform", e.transform))
  );

  let sim = null;
  let currentNodes = [];
  let selected = state.selected;
  let dragged = false;

  function savePositions(nodes) {
    for (const n of nodes) {
      state.positions.set(n.id, {
        x: n.x,
        y: n.y,
        vx: n.vx,
        vy: n.vy
      });
    }
  }

  function render(index) {
    state.index = index;

    if (currentNodes.length) savePositions(currentNodes);
    if (sim) sim.stop();

    zoomG.selectAll("*").remove();

    const period = data[index];
    periodName.textContent = `${period.period}  |  ${period.start} → ${period.end}`;

    const allNodes = period.nodes.map(d => {
      const prev = state.positions.get(d.id);
      return {
        ...d,
        sector: resolveSector(d),
        x: prev?.x ?? (W / 2 + (Math.random() - 0.5) * 40),
        y: prev?.y ?? (H / 2 + (Math.random() - 0.5) * 40),
        vx: prev?.vx ?? 0,
        vy: prev?.vy ?? 0
      };
    });

    const nodes = allNodes.filter(d => selectedSectors.includes(d.sector));
    currentNodes = nodes;

    const nodeSet = new Set(nodes.map(d => d.id));
    const links = period.edges
      .filter(d => nodeSet.has(d.source) && nodeSet.has(d.target))
      .map(d => ({ ...d }));

    if (!nodes.length) {
      zoomG.append("text")
        .attr("x", W / 2)
        .attr("y", H / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .attr("font-size", 14)
        .text("Selecione ao menos um setor.");
      return;
    }

    const sectors = [...new Set(nodes.map(d => d.sector))].sort();

    const color = d3.scaleOrdinal(d3.schemeTableau10).domain(sectors);

    const sizeScale = d3.scaleSqrt()
      .domain(d3.extent(allNodes, d => d.avg_volume))
      .range([5, 16]);

    const widthScale = d3.scaleLinear()
      .domain([0.5, 1])
      .range([0.6, 4]);

    const adj = new Map(nodes.map(n => [n.id, new Set()]));
    links.forEach(l => {
      const s = l.source?.id ?? l.source;
      const t = l.target?.id ?? l.target;
      adj.get(s)?.add(t);
      adj.get(t)?.add(s);
    });

    const linkLayer = zoomG.append("g");
    const nodeLayer = zoomG.append("g");
    const textLayer = zoomG.append("g");

    const linkG = linkLayer.selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#6699bb")
      .attr("stroke-opacity", d => 0.15 + d.weight * 0.28)
      .attr("stroke-width", d => widthScale(d.weight));

    const nodeG = nodeLayer.selectAll("g")
      .data(nodes, d => d.id)
      .join("g")
      .style("cursor", "pointer");

    const circles = nodeG.append("circle")
      .attr("r", d => sizeScale(d.avg_volume))
      .attr("fill", d => color(d.sector))
      .attr("fill-opacity", 0.82)
      .attr("stroke", d => d3.color(color(d.sector)).darker(0.8).toString())
      .attr("stroke-width", 1.2);

    const texts = textLayer.selectAll("text")
      .data(nodes, d => d.id)
      .join("text")
      .text(d => d.ticker_clean)
      .attr("font-size", d => Math.max(5.5, Math.min(sizeScale(d.avg_volume) * 0.72, 10)))
      .attr("font-weight", 600)
      .attr("fill", "#ffffff")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("pointer-events", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 2.2)
      .attr("paint-order", "stroke")
      .attr("opacity", 1);

    function updateStyles() {
      const conn = selected ? (adj.get(selected) ?? new Set()) : null;

      linkG
        .attr("stroke", l => {
          if (!selected) return "#6699bb";
          const s = l.source?.id ?? l.source;
          const t = l.target?.id ?? l.target;
          return s === selected || t === selected ? "#ff6b6b" : "#6699bb";
        })
        .attr("stroke-opacity", l => {
          if (!selected) return 0.15 + l.weight * 0.28;
          const s = l.source?.id ?? l.source;
          const t = l.target?.id ?? l.target;
          return s === selected || t === selected ? 0.95 : 0.04;
        })
        .attr("stroke-width", l => {
          if (!selected) return widthScale(l.weight);
          const s = l.source?.id ?? l.source;
          const t = l.target?.id ?? l.target;
          return s === selected || t === selected ? widthScale(l.weight) * 2.2 : widthScale(l.weight);
        });

      circles
        .attr("r", n => {
          const base = sizeScale(n.avg_volume);
          if (!selected) return base;
          return n.id === selected ? base + 4 : base;
        })
        .attr("fill-opacity", n => {
          if (!selected) return 0.82;
          return n.id === selected || conn.has(n.id) ? 1 : 0.12;
        })
        .attr("stroke", n => {
          if (!selected) return d3.color(color(n.sector)).darker(0.8).toString();
          if (n.id === selected) return "#ffffff";
          if (conn.has(n.id)) return "#ffcc00";
          return d3.color(color(n.sector)).darker(0.8).toString();
        })
        .attr("stroke-width", n => {
          if (!selected) return 1.2;
          return n.id === selected || conn.has(n.id) ? 2.5 : 1.2;
        })
        .attr("filter", n => selected && n.id === selected ? "url(#node-glow)" : null);

      texts
        .attr("opacity", n => {
          if (!selected) return 1;
          return n.id === selected || conn.has(n.id) ? 1 : 0.35;
        })
        .attr("fill", n => {
          if (!selected) return "#ffffff";
          if (n.id === selected) return "#ffffff";
          if (conn.has(n.id)) return "#ffcc00";
          return "#bbbbbb";
        })
        .attr("font-weight", n =>
          selected && (n.id === selected || conn.has(n.id)) ? 700 : 600
        );
    }

    sim = d3.forceSimulation(nodes)
      .alpha(0.18)
      .alphaMin(0.001)
      .alphaDecay(0.0018)
      .velocityDecay(0.65)
      .force("link",
        d3.forceLink(links)
          .id(d => d.id)
          .distance(60)
          .strength(d => d.weight * 0.38)
      )
      .force("charge", d3.forceManyBody().strength(-90))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collide", d3.forceCollide(d => sizeScale(d.avg_volume) + 4))
      .force("cluster", clusterForce(0.16));

    nodeG.call(
      d3.drag()
        .on("start", (e, d) => {
          dragged = false;
          if (!e.active) sim.alphaTarget(0.05).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (e, d) => {
          dragged = true;
          d.fx = e.x;
          d.fy = e.y;
        })
        .on("end", (e, d) => {
          if (!e.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

    nodeG.on("click", (event, d) => {
      event.stopPropagation();
      if (dragged) return;
      selected = selected === d.id ? null : d.id;
      state.selected = selected;
      updateStyles();
    });

    root.on("click", () => {
      selected = null;
      state.selected = null;
      updateStyles();
    });

    sim.on("tick", () => {
      linkG
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      nodeG.attr("transform", d => `translate(${d.x},${d.y})`);

      texts
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });

    updateStyles();
  }

  slider.addEventListener("input", e => {
    render(+e.target.value);
  });

  render(initialIndex);

  invalidation.then(() => {
    if (currentNodes.length) savePositions(currentNodes);
    if (sim) sim.stop();
  });

  return container;
}


async function _h3Events(FileAttachment){return(
(await FileAttachment("h3_copom_event_sector_returns.csv")
  .csv({typed: true}))
  .map(d => ({
    ...d,
    copom_date: new Date(d.copom_date)
  }))
)}

async function _h4Heatmap(FileAttachment){return(
(await FileAttachment("h4_community_sector_heatmap.csv")
  .csv({typed: true}))
  .map(d => ({
    ...d,
    start: new Date(d.start),
    end: new Date(d.end)
  }))
)}

function _metricOptionsH1(){return(
new Map([
  ["Correlação média absoluta", "avg_abs_corr"],
  ["Densidade da rede", "density"],
  ["Número de arestas", "n_edges"],
  ["Maior componente conectado", "largest_component_share"]
])
)}

function _selectedMetricH1(Inputs){return(
Inputs.select(
  new Map([
    ["Correlação média absoluta", "avg_abs_corr"],
    ["Densidade da rede", "density"],
    ["Número de arestas", "n_edges"],
    ["Maior componente conectado", "largest_component_share"]
  ]),
  {
    label: "Métrica para H1",
    value: "avg_abs_corr"
  }
)
)}

function _h1Chart(hMetrics,selectedMetricH1,d3,invalidation)
{
  const data = hMetrics.map(d => ({...d, value: +d[selectedMetricH1]}))
  const width = 920
  const height = 360
  const margin = {top: 20, right: 24, bottom: 52, left: 68}

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("font-family", "system-ui, sans-serif")
    .style("overflow", "visible")

  const x = d3.scalePoint()
    .domain(data.map(d => d.period))
    .range([margin.left, width - margin.right])
    .padding(0.5)

  svg.selectAll("line.vgrid")
  .data(data)
  .join("line")
  .attr("class", "vgrid")
  .attr("x1", d => x(d.period))
  .attr("x2", d => x(d.period))
  .attr("y1", margin.top)
  .attr("y2", height - margin.bottom)
  .attr("stroke", "#94a3b8")
  .attr("stroke-opacity", 0.15)
  .attr("stroke-width", 1)

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.value)).nice()
    .range([height - margin.bottom, margin.top])

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .call(g => g.selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end")
      .style("font-size", "11px"))
    .call(g => g.select(".domain").attr("stroke", "#e2e8f0"))

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(".3f")))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line")
      .attr("stroke", "#e2e8f0")
      .clone()
      .attr("x2", width - margin.left - margin.right)
      .attr("stroke-opacity", 0.6))
    .call(g => g.selectAll(".tick text").style("font-size", "11px"))

  const line = d3.line()
    .x(d => x(d.period))
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX)

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#3b82f6")
    .attr("stroke-width", 2)
    .attr("d", line)

svg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -(margin.top + (height - margin.top - margin.bottom) / 2))
  .attr("y", 16)
  .attr("text-anchor", "middle")
  .attr("font-size", "12px")
  .attr("fill", "#64748b")
  .text(selectedMetricH1)

  // Tooltip ancorado no body — funciona sempre no Observable
  const tooltipId = "h1-chart-tooltip"
  d3.select(`#${tooltipId}`).remove()
  const tooltip = d3.select("body").append("div")
    .attr("id", tooltipId)
    .style("position", "fixed")
    .style("pointer-events", "none")
    .style("display", "none")
    .style("background", "#0f172a")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border-radius", "6px")
    .style("font-size", "12px")
    .style("font-family", "system-ui, sans-serif")
    .style("line-height", "1.6")
    .style("min-width", "180px")
    .style("z-index", "9999")

  svg.selectAll("circle.hover-zone")
    .data(data)
    .join("circle")
    .attr("class", "hover-zone")
    .attr("cx", d => x(d.period))
    .attr("cy", d => y(d.value))
    .attr("r", 14)
    .attr("fill", "transparent")
    .style("cursor", "crosshair")
    .on("mousemove", function(event, d) {
      tooltip
        .style("display", "block")
        .style("left", (event.clientX + 16) + "px")
        .style("top",  (event.clientY - 20) + "px")
        .html(`
          <div style="font-weight:600;margin-bottom:2px">${d.period}</div>
          <div style="color:#94a3b8;font-size:11px;margin-bottom:6px">${d.phase.replaceAll("_", " ")}</div>
          <div>valor: <b>${(+d.value).toFixed(4)}</b></div>
          <div style="color:#94a3b8;font-size:11px;margin-top:2px">arestas: ${d.n_edges}</div>
        `)

      svg.selectAll("circle.point")
        .filter(p => p === d)
        .attr("r", 6)
        .attr("fill", "#1d4ed8")
    })
    .on("mouseleave", function(event, d) {
      tooltip.style("display", "none")
      svg.selectAll("circle.point")
        .filter(p => p === d)
        .attr("r", 4)
        .attr("fill", "#3b82f6")
    })

  // Remove tooltip quando a célula for invalidada
  invalidation.then(() => d3.select(`#${tooltipId}`).remove())

  return svg.node()
}


function _h2Chart(d3,hMetrics,invalidation)
{
  const allMetrics = ["Modularidade", "NMI vs setor", "Participação intra-setor"]
  const color = d3.scaleOrdinal()
    .domain(allMetrics)
    .range(["#2563eb", "#ea580c", "#16a34a"])

  const width = 920
  const height = 380
  const margin = {top: 20, right: 180, bottom: 52, left: 68}

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("font-family", "system-ui, sans-serif")
    .style("overflow", "visible")

  // Estado interno de seleção
  let active = new Set(allMetrics)

  const allData = hMetrics.flatMap(d => [
    {period: d.period, start: d.start, metric: "Modularidade",              value: +d.modularity},
    {period: d.period, start: d.start, metric: "NMI vs setor",              value: +d.nmi_sector},
    {period: d.period, start: d.start, metric: "Participação intra-setor",  value: +d.intra_sector_share}
  ]).filter(d => Number.isFinite(d.value))

  const periods = [...new Set(allData.map(d => d.period))]

  const x = d3.scalePoint()
    .domain(periods)
    .range([margin.left, width - margin.right])
    .padding(0.5)

  const yExtent = d3.extent(allData, d => d.value)
const y = d3.scaleLinear()
  .domain([0, 1])  // <-- troque yExtent por isso
  .range([height - margin.bottom, margin.top])

  // Gridlines verticais
  svg.selectAll("line.vgrid")
    .data(periods)
    .join("line")
    .attr("class", "vgrid")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "#94a3b8")
    .attr("stroke-opacity", 0.15)
    .attr("stroke-width", 1)

  // Eixo X
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .call(g => g.selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end")
      .style("font-size", "11px"))
    .call(g => g.select(".domain").attr("stroke", "#e2e8f0"))

  // Eixo Y
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
.call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(".1f")))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line")
      .attr("stroke", "#e2e8f0")
      .clone()
      .attr("x2", width - margin.left - margin.right)
      .attr("stroke", "#94a3b8")
      .attr("stroke-opacity", 0.15))
    .call(g => g.selectAll(".tick text").style("font-size", "11px"))

  // Label eixo Y
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + (height - margin.top - margin.bottom) / 2))
    .attr("y", 16)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "#64748b")
    .text("valor (0-1)")

  const line = d3.line()
    .x(d => x(d.period))
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX)

  const grouped = d3.group(allData, d => d.metric)

  // Grupos por métrica — paths e pontos
  const metricGroups = {}
  for (const [metric, values] of grouped) {
    const g = svg.append("g").attr("class", `metric-group`)

    g.append("path")
      .datum(values)
      .attr("class", "metric-line")
      .attr("fill", "none")
      .attr("stroke", color(metric))
      .attr("stroke-width", 2)
      .attr("d", line)

    g.selectAll("circle")
      .data(values)
      .join("circle")
      .attr("class", "metric-dot")
      .attr("cx", d => x(d.period))
      .attr("cy", d => y(d.value))
      .attr("r", 4)
      .attr("fill", color(metric))
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)

    metricGroups[metric] = g
  }

  // Tooltip
  const tooltipId = "h2-chart-tooltip"
  d3.select(`#${tooltipId}`).remove()
  const tooltip = d3.select("body").append("div")
    .attr("id", tooltipId)
    .style("position", "fixed")
    .style("pointer-events", "none")
    .style("display", "none")
    .style("background", "#0f172a")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border-radius", "6px")
    .style("font-size", "12px")
    .style("font-family", "system-ui, sans-serif")
    .style("line-height", "1.6")
    .style("min-width", "180px")
    .style("z-index", "9999")

  // Hover zones
  for (const [metric, values] of grouped) {
    svg.selectAll(`circle.hz-${metric.replace(/\s/g, "")}`)
      .data(values)
      .join("circle")
      .attr("cx", d => x(d.period))
      .attr("cy", d => y(d.value))
      .attr("r", 14)
      .attr("fill", "transparent")
      .style("cursor", "crosshair")
      .on("mousemove", function(event, d) {
        if (!active.has(d.metric)) return
        tooltip
          .style("display", "block")
          .style("left", (event.clientX + 16) + "px")
          .style("top",  (event.clientY - 20) + "px")
          .html(`
            <div style="font-weight:600;margin-bottom:2px">${d.period}</div>
            <div style="color:${color(d.metric)};font-size:11px;margin-bottom:6px">${d.metric}</div>
            <div>valor: <b>${d.value.toFixed(4)}</b></div>
          `)
        metricGroups[d.metric].selectAll("circle.metric-dot")
          .filter(p => p === d)
          .attr("r", 6)
      })
      .on("mouseleave", function(event, d) {
        tooltip.style("display", "none")
        metricGroups[d.metric].selectAll("circle.metric-dot")
          .filter(p => p === d)
          .attr("r", 4)
      })
  }

  // Legenda clicável
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 20}, ${margin.top + 10})`)

  allMetrics.forEach((m, i) => {
    const g = legend.append("g")
      .attr("transform", `translate(0, ${i * 28})`)
      .style("cursor", "pointer")

    const pill = g.append("rect")
      .attr("x", -6)
      .attr("y", -10)
      .attr("width", 148)
      .attr("height", 20)
      .attr("rx", 4)
      .attr("fill", "transparent")

    g.append("line")
      .attr("x1", 0).attr("x2", 18)
      .attr("y1", 0).attr("y2", 0)
      .attr("stroke", color(m))
      .attr("stroke-width", 2.5)

    g.append("circle")
      .attr("cx", 9).attr("cy", 0).attr("r", 3.5)
      .attr("fill", color(m))
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)

    const label = g.append("text")
      .attr("x", 26).attr("y", 4)
      .attr("font-size", 12)
      .attr("fill", color(m))
      .text(m)

    g.on("click", function() {
      if (active.has(m)) {
        active.delete(m)
        metricGroups[m].style("opacity", 0.15)
        label.attr("fill", "#94a3b8")
        pill.attr("fill", "transparent")
      } else {
        active.add(m)
        metricGroups[m].style("opacity", 1)
        label.attr("fill", color(m))
      }
    })
  })

  invalidation.then(() => d3.select(`#${tooltipId}`).remove())

  return svg.node()
}


function _h3OnlySignificant(Inputs){return(
Inputs.toggle({
  label: "Mostrar apenas betas significativos",
  value: false
})
)}

function _h3Radial(h3TickerYear,d3,h3OnlySignificant)
{
  const anos = [...new Set(h3TickerYear.map(d => +d.year))].sort(d3.ascending)
  let anoAtual = anos.includes(2022) ? 2022 : anos[0]
  let grupoSelecionado = null

  const width = 960, height = 960
  const radioArvore = 330
  const radioArco = 430
  const radioArcoIn = 400
  const DURACAO = 1500

  const GRUPOS = ["Mais sensível", "Intermediário", "Menos sensível"]
  const GRUPO_SHAPE = {
    "Mais sensível": "diamond",
    "Intermediário": "rect",
    "Menos sensível": "circle"
  }

  const SHAPE_FILL = "#334155"
  const SHAPE_STROKE = "#cbd5e1"
  const sectorPalette = [
    "#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F",
    "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC",
    "#2D6CDF", "#D37295"
  ]

  const base = h3OnlySignificant
    ? h3TickerYear.filter(d => d.significant)
    : h3TickerYear

  const setoresVis = [...new Set(base.map(d => d.sector).filter(Boolean))].sort()
  const sectorColor = d3.scaleOrdinal().domain(setoresVis).range(sectorPalette)

  function buildHierarchy(dados) {
    const map = d3.group(
      dados.filter(d => isFinite(d.beta_selic_30d)),
      d => d.beta_band || "Intermediário"
    )

    return {
      name: "Selic",
      children: GRUPOS.filter(g => map.has(g)).map(g => ({
        name: g,
        children: map.get(g)
          .sort((a, b) =>
            d3.ascending(a.sector, b.sector) ||
            d3.ascending(a.ticker_clean, b.ticker_clean)
          )
          .map(d => ({
            name: d.ticker_clean,
            sector: d.sector,
            value: Math.abs(d.beta_selic_30d) || 0.05,
            beta: d.beta_selic_30d,
            pvalue: d.pvalue,
            r2: d.r2,
            n_obs: d.n_obs,
            median_return_30d: d.median_return_30d_after_copom,
            volatility: d.avg_volatility_20d,
            drawdown: d.max_drawdown_pct,
            total_return: d.total_return_pct,
            significant: d.significant
          }))
      }))
    }
  }

  function getDados(ano) {
    return base.filter(d => +d.year === +ano)
  }

  function pos(d) {
    return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`
  }

  function parentPos(d) {
    const p = d.parent || d
    const x = p?.x ?? d.x ?? 0
    const y = p?.y ?? d.y ?? 0
    return `rotate(${x * 180 / Math.PI - 90}) translate(${y},0)`
  }

  const svg = d3.create("svg")
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .style("background", "#0d1117")
    .style("font-family", "sans-serif")
    .style("user-select", "none")

  const gYears = svg.append("g")
  const gLinks = svg.append("g")
  const gNodes = svg.append("g")

  const angleScale = d3.scalePoint()
    .domain(anos.map(String))
    .range([0, 2 * Math.PI])
    .padding(0.5)

  const arcGen = d3.arc()
    .innerRadius(radioArcoIn)
    .outerRadius(radioArco)
    .cornerRadius(4)

  const segW = (2 * Math.PI) / anos.length

  gYears.selectAll("path.arco")
    .data(anos)
    .join("path")
      .attr("class", "arco")
      .attr("d", d => arcGen({
        startAngle: angleScale(String(d)) - segW * 0.45,
        endAngle: angleScale(String(d)) + segW * 0.45
      }))
      .attr("fill", d => d === anoAtual ? "#475569" : "#334155")
      .attr("stroke", d => d === anoAtual ? "#e2e8f0" : "#0d1117")
      .attr("stroke-width", d => d === anoAtual ? 2.2 : 2)
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        anoAtual = d
        update()
      })

  gYears.selectAll("text.ano-label")
    .data(anos)
    .join("text")
      .attr("class", "ano-label")
      .attr("transform", d => {
        const a = angleScale(String(d)) - Math.PI / 2
        const r = (radioArcoIn + radioArco) / 2
        return `translate(${r * Math.cos(a)}, ${r * Math.sin(a)})`
      })
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 13)
      .attr("font-weight", d => d === anoAtual ? "700" : "500")
      .attr("fill", "#e5e7eb")
      .attr("pointer-events", "none")
      .text(d => d)

  const tooltip = svg.append("g")
    .attr("display", "none")
    .style("pointer-events", "none")

  tooltip.append("rect")
    .attr("rx", 6)
    .attr("ry", 6)
    .attr("fill", "#1e293b")
    .attr("stroke", "#94a3b8")
    .attr("stroke-width", 1)

  const ttLines = d3.range(7).map(i =>
    tooltip.append("text")
      .attr("x", 10)
      .attr("y", 18 + i * 16)
      .attr("font-size", 11)
      .attr("fill", "#e5e7eb")
  )

  function update() {
    const dados = getDados(anoAtual)
    const hier = buildHierarchy(dados)

    const root = d3.hierarchy(hier)
      .sum(d => d.value || 0)
      .sort((a, b) => b.value - a.value)

    d3.cluster().size([2 * Math.PI, radioArvore])(root)

    const t = svg.transition().duration(DURACAO).ease(d3.easeCubicInOut)
    const maxBeta = d3.max(dados, d => Math.abs(d.beta_selic_30d)) || 1
    const rScale = d3.scaleSqrt().domain([0, maxBeta]).range([3, 11])

    gYears.selectAll("path.arco")
      .transition(t)
      .attr("fill", d => d === anoAtual ? "#475569" : "#334155")
      .attr("stroke", d => d === anoAtual ? "#e2e8f0" : "#0d1117")
      .attr("stroke-width", d => d === anoAtual ? 2.2 : 2)

    gYears.selectAll("text.ano-label")
      .transition(t)
      .attr("font-weight", d => d === anoAtual ? "700" : "500")
      .attr("fill", "#e5e7eb")

    const radialLink = d3.linkRadial().angle(d => d.x).radius(d => d.y)

    const link = gLinks.selectAll("path.link")
      .data(root.links(), d => `${d.source.data.name}->${d.target.data.name}`)

    link.join(
      enter => enter.append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#29405c")
        .attr("stroke-width", 0.8)
        .attr("opacity", 0)
        .attr("d", radialLink)
        .call(enter => enter.transition(t).attr("opacity", 1).attr("d", radialLink)),
      update => update.call(update => update.transition(t)
        .attr("opacity", d => {
          if (!grupoSelecionado) return 1
          return (
            d.source.data.name === grupoSelecionado ||
            d.target.parent?.data?.name === grupoSelecionado
          ) ? 1 : 0.08
        })
        .attr("d", radialLink)
      ),
      exit => exit.call(exit => exit.transition(t).attr("opacity", 0).remove())
    )

    const node = gNodes.selectAll("g.node")
      .data(root.descendants(), d => `${d.depth}-${d.data.name}`)
      .join(
        enter => {
          const g = enter.append("g")
            .attr("class", "node")
            .attr("transform", d => parentPos(d))
            .attr("opacity", 0)

          g.each(function(d) {
            const sel = d3.select(this)
            if (d.depth === 0) sel.append("circle")
            else if (d.depth === 1) {
              const shape = GRUPO_SHAPE[d.data.name] || "circle"
              if (shape === "circle") sel.append("circle")
              else if (shape === "rect") sel.append("rect")
              else sel.append("polygon")
            } else sel.append("circle")
          })

          g.append("text")

          return g.call(enter => enter.transition(t)
            .attr("opacity", 1)
            .attr("transform", d => pos(d)))
        },
        update => update.call(update => update.transition(t)
          .attr("transform", d => pos(d))
          .attr("opacity", d => {
            if (!grupoSelecionado) return 1
            return (
              d.depth === 0 ||
              (d.depth === 1 && d.data.name === grupoSelecionado) ||
              (d.depth === 2 && d.parent.data.name === grupoSelecionado)
            ) ? 1 : 0.08
          })),
        exit => exit.call(exit => exit.transition(t)
          .attr("opacity", 0)
          .attr("transform", d => parentPos(d))
          .remove())
      )
      .style("cursor", d => d.depth >= 1 ? "pointer" : "default")

    node.select("circle")
      .transition(t)
      .attr("r", d => d.depth === 0 ? 6 : d.depth === 2 ? rScale(Math.abs(d.data.beta)) : 7)
      .attr("fill", d => {
        if (d.depth === 2) return sectorColor(d.data.sector)
        if (d.depth === 0) return "#94a3b8"
        return SHAPE_FILL
      })
      .attr("stroke", d => {
        if (d.depth === 2) return d3.color(sectorColor(d.data.sector)).darker(0.8).toString()
        return SHAPE_STROKE
      })
      .attr("stroke-width", d => d.depth === 1 ? 1.8 : d.depth === 0 ? 1.2 : 0.8)
      .attr("opacity", d => d.depth === 2 ? (d.data.significant ? 0.98 : 0.7) : 1)

    node.select("rect")
      .transition(t)
      .attr("x", -7)
      .attr("y", -7)
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", SHAPE_FILL)
      .attr("stroke", SHAPE_STROKE)
      .attr("stroke-width", 1.2)

    node.select("polygon")
      .transition(t)
      .attr("points", "0,-8 8,0 0,8 -8,0")
      .attr("fill", SHAPE_FILL)
      .attr("stroke", SHAPE_STROKE)
      .attr("stroke-width", 1.2)

    node.select("text")
      .transition(t)
      .attr("dy", "0.32em")
      .attr("x", d => d.x < Math.PI === !d.children ? 10 : -10)
      .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
      .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
      .attr("font-size", d => d.depth === 1 ? 11 : 8.5)
      .attr("font-weight", d => d.depth < 2 ? "700" : "400")
      .attr("fill", d => d.depth === 1 ? "#e2e8f0" : d.depth === 2 ? "#cbd5e1" : "#94a3b8")
      .text(d => d.data.name)

    node.filter(d => d.depth === 1)
      .on("click", function(event, d) {
        grupoSelecionado = grupoSelecionado === d.data.name ? null : d.data.name
        update()
      })

    node.filter(d => d.depth === 2)
      .on("mouseover", function(event, d) {
        const lines = [
          d.data.name,
          `Setor: ${d.data.sector || "Outros"}`,
          `Grupo: ${d.parent.data.name}`,
          `β Selic: ${d.data.beta?.toFixed(3)}`,
          `p-valor: ${d.data.pvalue?.toFixed(3)} | R²: ${d.data.r2?.toFixed(3)}`,
          `Retorno mediano 30d: ${d.data.median_return_30d?.toFixed(2)}%`,
          `Vol: ${d.data.volatility?.toFixed(2)} | DD: ${d.data.drawdown?.toFixed(2)}%`
        ]

        ttLines.forEach((t, i) => {
          t.text(lines[i] || "")
          t.attr("font-weight", i === 0 ? "700" : "400")
        })

        tooltip.select("rect")
          .attr("width", d3.max(lines, l => l.length) * 7)
          .attr("height", 16 * lines.length + 12)

        const angle = d.x - Math.PI / 2
        tooltip
          .attr("transform", `translate(${d.y * Math.cos(angle) + 20}, ${d.y * Math.sin(angle) - 20})`)
          .attr("display", null)
      })
      .on("mouseout", () => tooltip.attr("display", "none"))
  }

  update()
  return svg.node()
}


function _h3GroupFilter(Inputs){return(
Inputs.radio(
  ["todos", "sensivel_juros", "commodities", "outros"],
  {label: "Filtro H3", value: "todos"}
)
)}

function _h3Bars(h3Beta,d3)
{
  const data = [...h3Beta].sort((a, b) => d3.ascending(a.beta, b.beta))
  
  const width = 920
  const rowH = 28
  const height = Math.max(320, data.length * rowH + 70)
  const margin = {top: 24, right: 24, bottom: 52, left: 220}

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("font-family", "system-ui, sans-serif")

  const x = d3.scaleLinear()
    .domain([
      d3.min(data, d => Math.min(0, d.beta)) * 1.2,
      d3.max(data, d => Math.max(0, d.beta)) * 1.2 || 0.5
    ])
    .nice()
    .range([margin.left, width - margin.right])

  const y = d3.scaleBand()
    .domain(data.map(d => d.sector))
    .range([margin.top, height - margin.bottom])
    .padding(0.25)

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom + 12})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format(".1f")))
    .call(g => g.select(".domain").attr("stroke", "#e2e8f0"))

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSize(0))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick text").style("font-size", "11px"))

  svg.append("line")
    .attr("x1", x(0)).attr("x2", x(0))
    .attr("y1", margin.top).attr("y2", height - margin.bottom + 12)
    .attr("stroke", "#64748b")
    .attr("stroke-dasharray", "4,4")

  const bars = svg.selectAll("rect.bar")
    .data(data)
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => x(Math.min(0, d.beta)))
    .attr("y", d => y(d.sector))
    .attr("width", d => Math.abs(x(d.beta) - x(0)))
    .attr("height", y.bandwidth())
    .attr("rx", 3)
    .attr("fill", "#2563eb")
    .style("cursor", "pointer")
    .append("title")
    .text(d => `${d.sector}\nbeta=${d.beta.toFixed(3)}\np=${d.pvalue.toFixed(3)}\nR²=${d.r2.toFixed(3)}\n${d.sig_label}`)

  svg.selectAll("text.value")
    .data(data)
    .join("text")
    .attr("class", "value")
    .attr("x", d => x(d.beta) + (d.beta >= 0 ? 6 : -6))
    .attr("y", d => y(d.sector) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.beta >= 0 ? "start" : "end")
    .attr("font-size", 11)
    .text(d => d.beta.toFixed(2))



  svg.append("text")
    .attr("x", (margin.left + width - margin.right) / 2)
    .attr("y", height - 6)
    .attr("text-anchor", "middle")
    .attr("font-size", 11)
    .attr("fill", "#64748b")
    .text("beta (sensibilidade ao retorno da Selic)")

let active = null
  svg.selectAll("rect.bar").on("click", function(event, d) {
    active = active === d.sector ? null : d.sector
    svg.selectAll("rect.bar").style("opacity", b =>
      active === null || b.sector === active ? 1 : 0.3
    )
  })

  return svg.node()
}


function _ibovespa_series_temporais(__query,FileAttachment,invalidation){return(
__query(FileAttachment("ibovespa_series_temporais.csv"),{from:{table:"ibovespa_series_temporais"},sort:[],slice:{to:null,from:null},filter:[],select:{columns:null}},invalidation)
)}

function _tsChart(dfTS,setores,d3)
{
  const tickers = [...new Set(dfTS.map(d => d.ticker_clean))].sort()
  
  const sectorMap = Object.fromEntries(setores.map(d => [d.ticker_clean, d.sector]))
  
  const sectorList = [...new Set(tickers.map(t => sectorMap[t]).filter(Boolean))].sort()
  
  const palette = d3.scaleOrdinal()
    .domain(sectorList)
    .range(d3.schemeTableau10)

  const width = 920, height = 420
  const margin = {top: 16, right: 200, bottom: 40, left: 60}

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", "100%")
    .style("font-family", "system-ui, sans-serif")
    .style("background", "#0f172a")

  const byTicker = d3.group(
    dfTS.filter(d => d.cumulative_return != null),
    d => d.ticker_clean
  )

  const x = d3.scaleTime()
    .domain(d3.extent(dfTS, d => new Date(d.date)))
    .range([margin.left, width - margin.right])

  const y = d3.scaleLinear()
    .domain(d3.extent(dfTS.filter(d => d.cumulative_return != null), d => +d.cumulative_return)).nice()
    .range([height - margin.bottom, margin.top])

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d3.timeFormat("%b %Y")))
    .call(g => g.selectAll("text").attr("fill", "#94a3b8").style("font-size", "11px"))
    .call(g => g.select(".domain").attr("stroke", "#334155"))

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(".1f")))
    .call(g => g.selectAll("text").attr("fill", "#94a3b8").style("font-size", "11px"))
    .call(g => g.select(".domain").attr("stroke", "#334155"))
    .call(g => g.selectAll(".tick line")
      .clone().attr("x2", width - margin.left - margin.right)
      .attr("stroke", "#1e293b"))

  svg.append("line")
    .attr("x1", margin.left).attr("x2", width - margin.right)
    .attr("y1", y(0)).attr("y2", y(0))
    .attr("stroke", "#475569").attr("stroke-dasharray", "4,4")

  const line = d3.line()
    .x(d => x(new Date(d.date)))
    .y(d => y(+d.cumulative_return))
    .curve(d3.curveMonotoneX)

  let activeTicker = null

  const paths = {}
  for (const [ticker, values] of byTicker) {
    const sector = sectorMap[ticker]
    const color = palette(sector)
    const path = svg.append("path")
      .datum(values.sort((a, b) => new Date(a.date) - new Date(b.date)))
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.2)
      .attr("opacity", 0.6)
      .style("cursor", "pointer")
      .attr("d", line)
      .on("click", function(event, d) {
        activeTicker = activeTicker === ticker ? null : ticker
        update()
      })
    paths[ticker] = {path, sector, color}
  }

  function update() {
    for (const [t, {path}] of Object.entries(paths)) {
      if (activeTicker === null) {
        path.attr("opacity", 0.6).attr("stroke-width", 1.2)
      } else if (t === activeTicker) {
        path.attr("opacity", 1).attr("stroke-width", 2.5).raise()
      } else {
        path.attr("opacity", 0.08).attr("stroke-width", 1)
      }
    }
    labelText.text(activeTicker
      ? `${activeTicker} · ${sectorMap[activeTicker]}`
      : "clique em uma linha para destacar")
  }

  // Label ticker ativo
  const labelText = svg.append("text")
    .attr("x", margin.left + 8).attr("y", margin.top + 14)
    .attr("fill", "#e2e8f0").attr("font-size", 12)
    .text("clique em uma linha para destacar")

  // Legenda de setores
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 16}, ${margin.top})`)

  sectorList.forEach((s, i) => {
    const g = legend.append("g")
      .attr("transform", `translate(0, ${i * 22})`)
      .style("cursor", "pointer")

    g.append("line")
      .attr("x1", 0).attr("x2", 16).attr("y1", 0).attr("y2", 0)
      .attr("stroke", palette(s)).attr("stroke-width", 2.5)

    g.append("text")
      .attr("x", 22).attr("y", 4)
      .attr("fill", "#94a3b8").attr("font-size", 11)
      .text(s)

    g.on("click", function() {
      // clica no setor → destaca todos os tickers daquele setor
      const inSector = tickers.filter(t => sectorMap[t] === s)
      for (const [t, {path}] of Object.entries(paths)) {
        if (inSector.includes(t)) {
          path.attr("opacity", 1).attr("stroke-width", 2).raise()
        } else {
          path.attr("opacity", 0.05).attr("stroke-width", 1)
        }
      }
      labelText.text(`setor: ${s}`)
    })
  })

  // Clique no fundo reseta
  svg.on("click", function(event) {
    if (event.target.tagName !== "path") {
      activeTicker = null
      update()
    }
  })

  return svg.node()
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["h3_selic_beta_por_setor_enriched.csv", {url: new URL("./files/a6cae4f136af9fc1afe4d9a6c5ec11814bff7f5b73014550f71acdbafb8efaeee8f7b5a65120e445c192250dbc677214ecf12118bfe1918de99ab2b1e842affd.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["h3_copom_event_sector_returns.csv", {url: new URL("./files/4e15f9d8f8aeb1fe8bbf524d3882fba02e6338f9b9dd084806dd0253cc6766b614f15ae6619c07b88ae34df3ba81839c961574996c2cc769cf574547e2e006a0.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["h1_h2_network_metrics_thematic.csv", {url: new URL("./files/bd99141e6d21f664a72c2fb3f326e84c0760d9b104d37c4a5d5588bd173519fad7475bff5513d48b17eb190c569f37e1102ef8108fd3d08caa431e3603171241.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["h1_h2_network_metrics_quarterly.csv", {url: new URL("./files/30acb75dc2140ecaa4dfe79451ec5a854c58d8b2c75d8a342d5e0abaede5c9f0b9a1603bc532ae7b20d3a210ca6ae32252cc5ffe44e815cf602a643190e4409c.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["h4_community_sector_heatmap.csv", {url: new URL("./files/d69780a9a1e0d71e2f5a671b3afa7bc8714f8e38f9d4c58cea9d0cab1e98fe54f3fa99521c8a00cc25345f994a0a10311363bc7c4a3b81432c8ec353a340f254.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["h3_selic_beta_por_ticker_year.csv", {url: new URL("./files/93d871aca2e3d31a7073fb4645e044bb6bcb6d4d0cf84273591cfd8ae29898a0ca170f13bb09bdb02a99b23e02701b7abc54be3ce6376a81991a0d025e6a427d.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["ibovespa_setores-1.csv", {url: new URL("./files/8b1c279f96b2274d99b6e55c92563b97f041c3dbefd0171c4d740d710c536b08759a1b08ef4ce1a18b94d8d64656ef0be828a6c4baa5b985f4f3c810bf6afde6.csv", import.meta.url), mimeType: "text/csv", toString}],
    ["ibovespa_correlation_graph_quarterly.json", {url: new URL("./files/ccddc5089165c5852832cdd4b9eaea33197191e384ce849b96570961daf38e837401ead247e50f28ceb7bb1e6a3b6724aebbc716458556ddf19dee2a234f3295.json", import.meta.url), mimeType: "application/json", toString}],
    ["ibovespa_series_temporais.csv", {url: new URL("./files/6a8f61edfe24cbf6158fe3e6b006d69c505a86f47e28589fac35b8883d1e9f6312c9b40dd0434b9cab57781a93328f090204ff270fd89b8d4b9540373de1bb05.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("dfTS")).define("dfTS", ["FileAttachment"], _dfTS);
  main.variable(observer("hMetrics")).define("hMetrics", ["FileAttachment"], _hMetrics);
  main.variable(observer("hMetricsThematic")).define("hMetricsThematic", ["FileAttachment"], _hMetricsThematic);
  main.variable(observer("h3Beta")).define("h3Beta", ["FileAttachment"], _h3Beta);
  main.variable(observer("h3TickerYear")).define("h3TickerYear", ["FileAttachment"], _h3TickerYear);
  main.variable(observer()).define(["setores"], _8);
  main.variable(observer("setores")).define("setores", ["FileAttachment"], _setores);
  main.variable(observer("allSectors")).define("allSectors", ["setores"], _allSectors);
  main.variable(observer("viewof selectedSectors")).define("viewof selectedSectors", ["Inputs","allSectors"], _selectedSectors);
  main.variable(observer("selectedSectors")).define("selectedSectors", ["Generators", "viewof selectedSectors"], (G, _) => G.input(_));
  const child1 = runtime.module(define1);
  main.import("temporalForceGraph", child1);
  main.define("initial periodIndex", _periodIndex);
  main.variable(observer("mutable periodIndex")).define("mutable periodIndex", ["Mutable", "initial periodIndex"], (M, _) => new M(_));
  main.variable(observer("periodIndex")).define("periodIndex", ["mutable periodIndex"], _ => _.generator);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  main.variable(observer()).define(["globalThis","periodIndex","data","setores","d3","html","selectedSectors","invalidation"], _15);
  main.variable(observer("h3Events")).define("h3Events", ["FileAttachment"], _h3Events);
  main.variable(observer("h4Heatmap")).define("h4Heatmap", ["FileAttachment"], _h4Heatmap);
  main.variable(observer("metricOptionsH1")).define("metricOptionsH1", _metricOptionsH1);
  main.variable(observer("viewof selectedMetricH1")).define("viewof selectedMetricH1", ["Inputs"], _selectedMetricH1);
  main.variable(observer("selectedMetricH1")).define("selectedMetricH1", ["Generators", "viewof selectedMetricH1"], (G, _) => G.input(_));
  main.variable(observer("h1Chart")).define("h1Chart", ["hMetrics","selectedMetricH1","d3","invalidation"], _h1Chart);
  main.variable(observer("h2Chart")).define("h2Chart", ["d3","hMetrics","invalidation"], _h2Chart);
  main.variable(observer("viewof h3OnlySignificant")).define("viewof h3OnlySignificant", ["Inputs"], _h3OnlySignificant);
  main.variable(observer("h3OnlySignificant")).define("h3OnlySignificant", ["Generators", "viewof h3OnlySignificant"], (G, _) => G.input(_));
  main.variable(observer("h3Radial")).define("h3Radial", ["h3TickerYear","d3","h3OnlySignificant"], _h3Radial);
  main.variable(observer("viewof h3GroupFilter")).define("viewof h3GroupFilter", ["Inputs"], _h3GroupFilter);
  main.variable(observer("h3GroupFilter")).define("h3GroupFilter", ["Generators", "viewof h3GroupFilter"], (G, _) => G.input(_));
  main.variable(observer("h3Bars")).define("h3Bars", ["h3Beta","d3"], _h3Bars);
  const child2 = runtime.module(define2);
  main.import("vl", child2);
  main.variable(observer("ibovespa_series_temporais")).define("ibovespa_series_temporais", ["__query","FileAttachment","invalidation"], _ibovespa_series_temporais);
  main.variable(observer("tsChart")).define("tsChart", ["dfTS","setores","d3"], _tsChart);
  return main;
}
