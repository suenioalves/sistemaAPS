console.log('plafam_analise.js carregado');

(function(){
  const state = {
    equipe: 'Todas',
    microarea: 'Todas as áreas',
    inicio: null,
    fim: null,
    granularidade: 'month'
  };

  let charts = {};
  let mixDataCache = { labels: [], valuesAbs: [], valuesPct: [], total: 0 };
  let mixMode = 'abs'; // 'abs' | 'pct'

  function qs(id){ return document.getElementById(id); }

  // Tema (dark mode) persistente
  function applyTheme(){
    const saved = localStorage.getItem('plafam_theme');
    const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDark);
  }
  function toggleTheme(){
    const isDark = document.documentElement.classList.contains('dark');
    const next = isDark ? 'light' : 'dark';
    localStorage.setItem('plafam_theme', next);
    applyTheme();
    // resize charts para recomputar cores
    setTimeout(()=>Object.values(charts).forEach(c => c && c.resize()), 50);
  }

  // Compartilhar visão via URL (querystring)
  function buildQuery(){
    const p = new URLSearchParams();
    if(state.equipe && state.equipe !== 'Todas') p.set('equipe', state.equipe);
    if(state.microarea && state.microarea !== 'Todas as áreas') p.set('microarea', state.microarea);
    if(state.inicio) p.set('inicio', state.inicio);
    if(state.fim) p.set('fim', state.fim);
    if(state.granularidade && state.granularidade !== 'month') p.set('gran', state.granularidade);
    return p;
  }
  function applyQuery(){
    const p = new URLSearchParams(location.search);
    state.equipe = p.get('equipe') || state.equipe;
    state.microarea = p.get('microarea') || state.microarea;
    state.inicio = p.get('inicio') || null;
    state.fim = p.get('fim') || null;
    state.granularidade = p.get('gran') || state.granularidade;
  }
  function updateUrl(){
    const p = buildQuery();
    const url = `${location.pathname}?${p.toString()}`;
    history.replaceState({}, '', url);
  }

  // Skeleton helpers
  function showSkel(ids){ ids.forEach(id => qs(id)?.classList.remove('hidden')); }
  function hideSkel(ids){ ids.forEach(id => qs(id)?.classList.add('hidden')); }

  // Chips de filtros ativos
  function renderChips(){
    const c = qs('chips-container');
    if(!c) return;
    c.innerHTML = '';
    const chips = [];
    if(state.equipe && state.equipe !== 'Todas') chips.push(['equipe', `Equipe: ${state.equipe}`]);
    if(state.microarea && state.microarea !== 'Todas as áreas') chips.push(['microarea', state.microarea]);
    if(state.inicio) chips.push(['inicio', `Início: ${new Date(state.inicio).toLocaleDateString('pt-BR')}`]);
    if(state.fim) chips.push(['fim', `Fim: ${new Date(state.fim).toLocaleDateString('pt-BR')}`]);
    if(state.granularidade !== 'month') chips.push(['gran', `Gran: ${state.granularidade}`]);
    chips.forEach(([key, label]) => {
      const el = document.createElement('span');
      el.className = 'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800';
      el.innerHTML = `${label} <button data-k="${key}" class="ml-1 ri-close-line"></button>`;
      c.appendChild(el);
    });
    c.querySelectorAll('button[data-k]').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.getAttribute('data-k');
        if(k === 'equipe') state.equipe = 'Todas';
        if(k === 'microarea') state.microarea = 'Todas as áreas';
        if(k === 'inicio') { 
          state.inicio = null; 
          const inicioEl = qs('inicio');
          if(inicioEl) inicioEl.value = ''; 
        }
        if(k === 'fim') { 
          state.fim = null; 
          const fimEl = qs('fim');
          if(fimEl) fimEl.value = ''; 
        }
        if(k === 'gran') { 
          state.granularidade = 'month'; 
          const granularidadeEl = qs('granularidade');
          if(granularidadeEl) granularidadeEl.value = 'month'; 
        }
        syncControls();
        refreshAll();
      });
    });
  }

  function syncControls(){
    // Seletores e datas
    const selEquipe = qs('filtro-equipe');
    const selAgente = qs('filtro-agente');
    if(selEquipe) selEquipe.value = state.equipe;
    if(selAgente) selAgente.value = state.microarea;
    if(state.inicio) {
      const inicioEl = qs('inicio');
      if(inicioEl) inicioEl.value = state.inicio;
    }
    if(state.fim) {
      const fimEl = qs('fim');
      if(fimEl) fimEl.value = state.fim;
    }
    const granularidadeEl = qs('granularidade');
    if(granularidadeEl) granularidadeEl.value = state.granularidade;
    renderChips();
    updateUrl();
  }

  async function fetchJSON(url){
    const r = await fetch(url);
    if(!r.ok) throw new Error('HTTP '+r.status);
    return r.json();
  }

  async function carregarEquipesEAgentes(){
    const data = await fetchJSON('/api/equipes_com_agentes_plafam');
    const selEquipe = qs('filtro-equipe');
    const selAgente = qs('filtro-agente');

    selEquipe.innerHTML = '';
    const optTodas = document.createElement('option');
    optTodas.value = 'Todas';
    optTodas.textContent = 'Todas as equipes';
    selEquipe.appendChild(optTodas);

    (data || []).forEach(eq => {
      const opt = document.createElement('option');
      opt.value = eq.nome_equipe;
      opt.textContent = eq.nome_equipe;
      selEquipe.appendChild(opt);
    });

    selEquipe.value = state.equipe;

    function popularAgentes(){
      selAgente.innerHTML = '';
      const optAll = document.createElement('option');
      optAll.value = 'Todas as áreas';
      optAll.textContent = 'Todas as áreas';
      selAgente.appendChild(optAll);

      const eq = (data || []).find(e => e.nome_equipe === selEquipe.value);
      if(eq && eq.agentes){
        eq.agentes.forEach(ag => {
          const displayText = `Área ${ag.micro_area} - ${ag.nome_agente}`;
          const opt = document.createElement('option');
          opt.value = displayText;
          opt.textContent = displayText;
          selAgente.appendChild(opt);
        });
      }
      selAgente.value = state.microarea;
    }

    selEquipe.addEventListener('change', () => {
      state.equipe = selEquipe.value;
      state.microarea = 'Todas as áreas';
      popularAgentes();
      syncControls();
      refreshAll();
    });

    popularAgentes();
  }

  function buildParams(){
    const p = new URLSearchParams();
    if(state.equipe && state.equipe !== 'Todas') p.set('equipe', state.equipe);
    if(state.microarea && state.microarea !== 'Todas as áreas') p.set('microarea', state.microarea);
    return p.toString();
  }

  async function atualizarKPIs(){
    showSkel(['skel-kpi-gestantes','skel-kpi-sem','skel-kpi-atraso','skel-kpi-dia']);
    const res = await fetchJSON('/api/plafam/analytics/status_snapshot?' + buildParams());
    qs('kpi-gestantes').textContent = res.gestantes || 0;
    qs('kpi-sem-metodo').textContent = res.sem_metodo || 0;
    qs('kpi-atraso').textContent = res.metodo_atraso || 0;
    qs('kpi-em-dia').textContent = res.metodo_em_dia || 0;
    hideSkel(['skel-kpi-gestantes','skel-kpi-sem','skel-kpi-atraso','skel-kpi-dia']);
  }

  function renderDonutStatus(data){
    const el = qs('chart-status');
    charts.status = charts.status || echarts.init(el);
    const seriesData = [
      {name: 'Gestantes', value: data.gestantes||0, itemStyle: { color: '#ec4899' }},
      {name: 'Sem método', value: data.sem_metodo||0, itemStyle: { color: '#ef4444' }},
      {name: 'Método em atraso', value: data.metodo_atraso||0, itemStyle: { color: '#facc15' }},
      {name: 'Método em dia', value: data.metodo_em_dia||0, itemStyle: { color: '#22c55e' }}
    ];
    charts.status.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { color: getLegendColor() } },
      series: [{
        type: 'pie', radius: ['50%','75%'], avoidLabelOverlap: true,
        label: { show: false }, labelLine: { show: false },
        data: seriesData
      }]
    });
  }

  function getLegendColor(){
    return document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151';
  }

  function exportChartPNG(chart, filename){
    const url = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff' });
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
  }

  async function atualizarDonut(){
    showSkel(['skel-status']);
    const data = await fetchJSON('/api/plafam/analytics/status_snapshot?' + buildParams());
    renderDonutStatus(data);
    hideSkel(['skel-status']);
  }

  async function atualizarMethodMix(){
    showSkel(['skel-mix']);
    const data = await fetchJSON('/api/plafam/analytics/method_mix?' + buildParams());
    const el = qs('chart-mix');
    charts.mix = charts.mix || echarts.init(el);
    // Filtrar fora 'SEM MÉTODO'
    const filtered = (data.mix || []).filter(x => x.categoria !== 'SEM MÉTODO');
    const labels = filtered.map(x => x.categoria);
    const valuesAbs = filtered.map(x => x.total);
    const total = valuesAbs.reduce((a,b)=>a+b,0) || 1;
    const valuesPct = valuesAbs.map(v => Number(((v/total)*100).toFixed(1)));
    mixDataCache = { labels, valuesAbs, valuesPct, total };
    const values = mixMode === 'abs' ? valuesAbs : valuesPct;
    const yAxisLabel = {
      color: getLegendColor(),
      formatter: (val) => mixMode === 'pct' ? `${val}%` : `${val}`
    };
    charts.mix.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', formatter: (params) => {
        const p = params[0];
        const idx = p.dataIndex;
        const abs = valuesAbs[idx];
        const pct = valuesPct[idx];
        return `${p.axisValue}<br/>${abs} (${pct}%)`;
      } },
      xAxis: { type: 'category', data: labels, axisLabel: { rotate: 30, color: getLegendColor() } },
      yAxis: { type: 'value', axisLabel: yAxisLabel, max: mixMode==='pct'? 100: null, splitLine: { lineStyle: { color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb' } } },
      grid: { left: 40, right: 16, bottom: 60, top: 16 },
      series: [{ type: 'bar', data: values, itemStyle: { color: '#1D70B8' }, label: { show: true, position: 'top', formatter: (p) => {
        const idx = p.dataIndex;
        const abs = valuesAbs[idx];
        const pct = valuesPct[idx];
        return mixMode==='abs' ? `${abs} (${pct}%)` : `${pct}% (${abs})`;
      }, color: getLegendColor() } }]
    });
    hideSkel(['skel-mix']);
  }

  // Mapa de códigos de ação para nomes (0-19)
  const statusActionMap = {
    '0': 'Nenhuma ação até o momento',
    '1': 'Convite com o agente',
    '2': 'Convite entregue ao cliente',
    '3': 'Deseja iniciar (após convite)',
    '4': 'Deseja iniciar (via consulta)',
    '5': 'Já em uso - Mensal',
    '6': 'Já em uso - Vasectomia',
    '7': 'Já em uso - Trimestral',
    '8': 'Já em uso - DIU',
    '9': 'Já em uso - Implante',
    '10': 'Já em uso - Laqueadura',
    '11': 'Já em uso - Histerectomia (esposo)',
    '12': 'Já em uso - Outros',
    '13': 'Cliente não encontrado',
    '14': 'Reavaliar em 6 meses',
    '15': 'Reavaliar em 1 ano',
    '16': 'Fora da área - Outra área',
    '17': 'Fora da área - Não reside na cidade',
    '18': 'Fora da área - Sem informação',
    '19': 'Fora da área - Área indígena'
  };

  async function atualizarAcoesTimeseries(){
    showSkel(['skel-acoes']);
    const data = await fetchJSON('/api/plafam/analytics/actions_overview?' + buildParams());
    const el = qs('chart-acoes');
    charts.acoes = charts.acoes || echarts.init(el);
    const entries = Object.entries(data.counts || {}).sort(([a],[b]) => Number(a)-Number(b));
    const labels = entries.map(([k]) => statusActionMap[k] || `Ação ${k}`);
    const values = entries.map(([,v]) => v);
    charts.acoes.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', formatter: (params) => {
        const p = params[0];
        return `${p.axisValue}<br/>Total: ${p.value}`;
      } },
      grid: { left: 60, right: 16, bottom: 100, top: 16 },
      xAxis: { 
        type: 'category', 
        data: labels, 
        axisLabel: { 
          color: getLegendColor(),
          rotate: 45,
          interval: 0
        } 
      },
      yAxis: { 
        type: 'value', 
        axisLabel: { color: getLegendColor() }, 
        splitLine: { lineStyle: { color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb' } } 
      },
      series: [{ 
        type: 'bar', 
        data: values,
        itemStyle: { color: '#1D70B8' },
        label: { 
          show: true, 
          position: 'top', 
          formatter: '{c}',
          color: getLegendColor() 
        }
      }]
    });
    hideSkel(['skel-acoes']);
  }


  async function atualizarDistribuicaoEquipe(){
    showSkel(['skel-distribuicao-equipe']);
    const data = await fetchJSON('/api/graficos_painel_plafam?' + buildParams());
    const el = qs('chart-distribuicao-equipe');
    charts.distribuicaoEquipe = charts.distribuicaoEquipe || echarts.init(el);
    const pizza = data.pizza_data || {};
    const seriesData = [
      {name: 'Gestantes', value: pizza.gestantes||0, itemStyle: { color: '#ec4899' }},
      {name: 'Sem método', value: pizza.sem_metodo||0, itemStyle: { color: '#ef4444' }},
      {name: 'Método em atraso', value: pizza.metodo_atraso||0, itemStyle: { color: '#facc15' }},
      {name: 'Método em dia', value: pizza.metodo_em_dia||0, itemStyle: { color: '#22c55e' }}
    ];
    charts.distribuicaoEquipe.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { color: getLegendColor() } },
      series: [{
        type: 'pie', radius: ['50%','75%'], avoidLabelOverlap: true,
        label: { show: false }, labelLine: { show: false },
        data: seriesData
      }]
    });
    hideSkel(['skel-distribuicao-equipe']);
  }

  async function atualizarDistribuicaoMicroarea(){
    showSkel(['skel-distribuicao-microarea']);
    const data = await fetchJSON('/api/graficos_painel_plafam?' + buildParams());
    const el = qs('chart-distribuicao-microarea');
    charts.distribuicaoMicroarea = charts.distribuicaoMicroarea || echarts.init(el);
    const barras = data.bar_chart_data || [];
    let labels = [];
    let datasets = [[],[],[],[]];
    let tituloGrafico = '';
    
    if(barras.length && barras[0].microarea !== undefined) {
      // Dados por microárea (equipe específica selecionada)
      labels = barras.map(x => x.microarea + (x.nome_agente ? ' - ' + x.nome_agente : ''));
      tituloGrafico = 'Distribuição por Microárea';
      barras.forEach((x,i)=>{
        datasets[0].push(x.gestantes||0);
        datasets[1].push(x.sem_metodo||0);
        datasets[2].push(x.metodo_atraso||0);
        datasets[3].push(x.metodo_em_dia||0);
      });
    } else if(barras.length && barras[0].nome_equipe !== undefined) {
      // Dados por equipe (todas as equipes selecionadas)
      labels = barras.map(x => x.nome_equipe);
      tituloGrafico = 'Distribuição por Equipe';
      barras.forEach((x,i)=>{
        datasets[0].push(x.gestantes||0);
        datasets[1].push(x.sem_metodo||0);
        datasets[2].push(x.metodo_atraso||0);
        datasets[3].push(x.metodo_em_dia||0);
      });
    }
    
    // Atualizar o título no HTML
    const tituloEl = qs('chart-microarea-titulo');
    if(tituloEl) tituloEl.textContent = tituloGrafico;
    
    charts.distribuicaoMicroarea.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, textStyle: { color: getLegendColor() } },
      grid: { left: 40, right: 16, bottom: 60, top: 40 },
      xAxis: { 
        type: 'category', 
        data: labels, 
        axisLabel: { 
          color: getLegendColor(),
          rotate: 30,
          interval: 0 
        } 
      },
      yAxis: { 
        type: 'value', 
        axisLabel: { color: getLegendColor() }, 
        splitLine: { lineStyle: { color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb' } } 
      },
      series: [
        { name: 'Gestantes', type: 'bar', stack: 'total', data: datasets[0], itemStyle: { color: '#ec4899' } },
        { name: 'Sem método', type: 'bar', stack: 'total', data: datasets[1], itemStyle: { color: '#ef4444' } },
        { name: 'Método em atraso', type: 'bar', stack: 'total', data: datasets[2], itemStyle: { color: '#facc15' } },
        { name: 'Método em dia', type: 'bar', stack: 'total', data: datasets[3], itemStyle: { color: '#22c55e' } }
      ]
    });
    hideSkel(['skel-distribuicao-microarea']);
  }

  async function refreshAll(){
    await atualizarKPIs();
    await atualizarDonut();
    await atualizarMethodMix();
    await atualizarAcoesTimeseries();
    await atualizarDistribuicaoMicroarea();
  }

  function attachHandlers(){
    // Tema
    qs('btn-darkmode')?.addEventListener('click', toggleTheme);

    // Compartilhar
    qs('btn-share')?.addEventListener('click', async () => {
      const url = `${location.origin}${location.pathname}?${buildQuery().toString()}`;
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copiado para a área de transferência.');
      } catch {
        prompt('Copie o link:', url);
      }
    });

    // Exportações
    qs('export-status')?.addEventListener('click', () => exportChartPNG(charts.status, 'plafam-status.png'));
    qs('export-mix')?.addEventListener('click', () => exportChartPNG(charts.mix, 'plafam-mix.png'));
    qs('export-acoes')?.addEventListener('click', () => exportChartPNG(charts.acoes, 'plafam-acoes-tempo.png'));
    qs('export-distribuicao-microarea')?.addEventListener('click', () => exportChartPNG(charts.distribuicaoMicroarea, 'plafam-distribuicao-microarea.png'));

    // Filtros
    qs('btn-aplicar').addEventListener('click', () => {
      state.inicio = qs('inicio').value || null;
      state.fim = qs('fim').value || null;
      syncControls();
      refreshAll();
    });
    qs('btn-limpar').addEventListener('click', () => {
      state.equipe = 'Todas';
      state.microarea = 'Todas as áreas';
      state.inicio = null; 
      const inicioEl = qs('inicio');
      if(inicioEl) inicioEl.value = '';
      state.fim = null; 
      const fimEl = qs('fim');
      if(fimEl) fimEl.value = '';
      const filtroEquipeEl = qs('filtro-equipe');
      if(filtroEquipeEl) filtroEquipeEl.value = 'Todas';
      const filtroAgenteEl = qs('filtro-agente');
      if(filtroAgenteEl) filtroAgenteEl.value = 'Todas as áreas';
      syncControls();
      refreshAll();
    });
    qs('granularidade')?.addEventListener('change', (e) => {
      state.granularidade = e.target.value;
      syncControls();
      atualizarAcoesTimeseries();
    });
    qs('filtro-agente').addEventListener('change', (e) => {
      state.microarea = e.target.value;
      syncControls();
      refreshAll();
    });

    // Alternância ABS/% no mix de métodos
    qs('toggle-mix-mode')?.addEventListener('click', () => {
      mixMode = mixMode === 'abs' ? 'pct' : 'abs';
      const text = qs('toggle-mix-text');
      if(text) text.textContent = mixMode === 'abs' ? 'Ver %' : 'Ver nº';
      // re-render com cache
      const el = qs('chart-mix');
      charts.mix = charts.mix || echarts.init(el);
      const values = mixMode==='abs' ? mixDataCache.valuesAbs : mixDataCache.valuesPct;
      const yAxisLabel = {
        color: getLegendColor(),
        formatter: (val) => mixMode === 'pct' ? `${val}%` : `${val}`
      };
      charts.mix.setOption({
        yAxis: { type: 'value', axisLabel: yAxisLabel, max: mixMode==='pct'? 100: null },
        series: [{ type: 'bar', data: values, itemStyle: { color: '#1D70B8' }, label: { show: true, position: 'top', formatter: (p) => {
          const idx = p.dataIndex;
          const abs = mixDataCache.valuesAbs[idx];
          const pct = mixDataCache.valuesPct[idx];
          return mixMode==='abs' ? `${abs} (${pct}%)` : `${pct}% (${abs})`;
        }, color: getLegendColor() } }]
      });
    });

    window.addEventListener('resize', () => {
      Object.values(charts).forEach(c => c && c.resize());
    });
  }

  async function init(){
    applyTheme();
    applyQuery();
    await carregarEquipesEAgentes();
    attachHandlers();
    syncControls();
    await refreshAll();
  }

  document.addEventListener('DOMContentLoaded', init);
})(); 