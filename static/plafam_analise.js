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
        if(k === 'inicio') { state.inicio = null; qs('inicio').value = ''; }
        if(k === 'fim') { state.fim = null; qs('fim').value = ''; }
        if(k === 'gran') { state.granularidade = 'month'; qs('granularidade').value = 'month'; }
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
    if(state.inicio) qs('inicio').value = state.inicio;
    if(state.fim) qs('fim').value = state.fim;
    qs('granularidade').value = state.granularidade;
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
    const labels = (data.mix || []).map(x => x.categoria);
    const values = (data.mix || []).map(x => x.total);
    charts.mix.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: labels, axisLabel: { rotate: 30, color: getLegendColor() } },
      yAxis: { type: 'value', axisLabel: { color: getLegendColor() }, splitLine: { lineStyle: { color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb' } } },
      grid: { left: 40, right: 16, bottom: 60, top: 16 },
      series: [{ type: 'bar', data: values, itemStyle: { color: '#1D70B8' } }]
    });
    hideSkel(['skel-mix']);
  }

  async function atualizarAcoesTimeseries(){
    showSkel(['skel-acoes']);
    const p = new URLSearchParams(buildParams());
    p.set('granularity', state.granularidade);
    const data = await fetchJSON('/api/plafam/analytics/actions_timeseries?' + p.toString());
    const el = qs('chart-acoes');
    charts.acoes = charts.acoes || echarts.init(el);
    const seriesMap = data.series || {};
    const allPeriods = new Set();
    Object.values(seriesMap).forEach(arr => arr.forEach(p => allPeriods.add(p.period)));
    const periods = Array.from(allPeriods).sort();
    const series = Object.entries(seriesMap).map(([status, arr]) => {
      const map = new Map(arr.map(x => [x.period, x.count]));
      return { name: `Ação ${status}`, type: 'line', smooth: true, data: periods.map(d => map.get(d)||0) };
    });
    charts.acoes.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: getLegendColor() } },
      grid: { left: 40, right: 16, bottom: 40, top: 40 },
      xAxis: { type: 'category', data: periods, axisLabel: { color: getLegendColor() } },
      yAxis: { type: 'value', axisLabel: { color: getLegendColor() }, splitLine: { lineStyle: { color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb' } } },
      series
    });
    hideSkel(['skel-acoes']);
  }

  async function atualizarAcoesBar(){
    showSkel(['skel-acoes-bar']);
    const data = await fetchJSON('/api/plafam/analytics/actions_overview?' + buildParams());
    const el = qs('chart-acoes-bar');
    charts.acoesBar = charts.acoesBar || echarts.init(el);
    const entries = Object.entries(data.counts || {}).sort(([a],[b]) => Number(a)-Number(b));
    const labels = entries.map(([k]) => `Ação ${k}`);
    const values = entries.map(([,v]) => v);
    charts.acoesBar.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 16, bottom: 40, top: 16 },
      xAxis: { type: 'category', data: labels, axisLabel: { color: getLegendColor() } },
      yAxis: { type: 'value', axisLabel: { color: getLegendColor() }, splitLine: { lineStyle: { color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb' } } },
      series: [{ type: 'bar', data: values }]
    });
    hideSkel(['skel-acoes-bar']);
  }

  async function refreshAll(){
    await atualizarKPIs();
    await atualizarDonut();
    await atualizarMethodMix();
    await atualizarAcoesTimeseries();
    await atualizarAcoesBar();
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
    qs('export-acoes-bar')?.addEventListener('click', () => exportChartPNG(charts.acoesBar, 'plafam-acoes-overview.png'));

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
      state.inicio = null; qs('inicio').value = '';
      state.fim = null; qs('fim').value = '';
      qs('filtro-equipe').value = 'Todas';
      qs('filtro-agente').value = 'Todas as áreas';
      syncControls();
      refreshAll();
    });
    qs('granularidade').addEventListener('change', (e) => {
      state.granularidade = e.target.value;
      syncControls();
      atualizarAcoesTimeseries();
    });
    qs('filtro-agente').addEventListener('change', (e) => {
      state.microarea = e.target.value;
      syncControls();
      refreshAll();
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