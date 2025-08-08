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

    // microáreas dependentes da equipe
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
    const res = await fetchJSON('/api/plafam/analytics/status_snapshot?' + buildParams());
    qs('kpi-gestantes').textContent = res.gestantes || 0;
    qs('kpi-sem-metodo').textContent = res.sem_metodo || 0;
    qs('kpi-atraso').textContent = res.metodo_atraso || 0;
    qs('kpi-em-dia').textContent = res.metodo_em_dia || 0;
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
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie', radius: ['50%','75%'], avoidLabelOverlap: true,
        label: { show: false }, labelLine: { show: false },
        data: seriesData
      }]
    });
  }

  async function atualizarDonut(){
    const data = await fetchJSON('/api/plafam/analytics/status_snapshot?' + buildParams());
    renderDonutStatus(data);
  }

  async function atualizarMethodMix(){
    const data = await fetchJSON('/api/plafam/analytics/method_mix?' + buildParams());
    const el = qs('chart-mix');
    charts.mix = charts.mix || echarts.init(el);
    const labels = (data.mix || []).map(x => x.categoria);
    const values = (data.mix || []).map(x => x.total);
    charts.mix.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: labels, axisLabel: { rotate: 30 } },
      yAxis: { type: 'value' },
      grid: { left: 40, right: 16, bottom: 60, top: 16 },
      series: [{ type: 'bar', data: values, itemStyle: { color: '#1D70B8' } }]
    });
  }

  async function atualizarAcoesTimeseries(){
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
      tooltip: { trigger: 'axis' },
      legend: { top: 0 },
      grid: { left: 40, right: 16, bottom: 40, top: 40 },
      xAxis: { type: 'category', data: periods },
      yAxis: { type: 'value' },
      series
    });
  }

  async function atualizarAcoesBar(){
    const data = await fetchJSON('/api/plafam/analytics/actions_overview?' + buildParams());
    const el = qs('chart-acoes-bar');
    charts.acoesBar = charts.acoesBar || echarts.init(el);
    const entries = Object.entries(data.counts || {}).sort(([a],[b]) => Number(a)-Number(b));
    const labels = entries.map(([k]) => `Ação ${k}`);
    const values = entries.map(([,v]) => v);
    charts.acoesBar.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 16, bottom: 40, top: 16 },
      xAxis: { type: 'category', data: labels },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: values }]
    });
  }

  async function refreshAll(){
    await atualizarKPIs();
    await atualizarDonut();
    await atualizarMethodMix();
    await atualizarAcoesTimeseries();
    await atualizarAcoesBar();
  }

  function attachHandlers(){
    qs('btn-aplicar').addEventListener('click', () => {
      state.inicio = qs('inicio').value || null;
      state.fim = qs('fim').value || null;
      refreshAll();
    });
    qs('btn-limpar').addEventListener('click', () => {
      state.equipe = 'Todas';
      state.microarea = 'Todas as áreas';
      state.inicio = null; qs('inicio').value = '';
      state.fim = null; qs('fim').value = '';
      qs('filtro-equipe').value = 'Todas';
      qs('filtro-agente').value = 'Todas as áreas';
      refreshAll();
    });
    qs('granularidade').addEventListener('change', (e) => {
      state.granularidade = e.target.value;
      atualizarAcoesTimeseries();
    });
    qs('filtro-agente').addEventListener('change', (e) => {
      state.microarea = e.target.value;
      refreshAll();
    });
    qs('filtro-equipe').addEventListener('change', async (e) => {
      state.equipe = e.target.value;
      // repopula microáreas com base na equipe selecionada
      await carregarEquipesEAgentes();
      refreshAll();
    });
    window.addEventListener('resize', () => {
      Object.values(charts).forEach(c => c && c.resize());
    });
  }

  async function init(){
    await carregarEquipesEAgentes();
    attachHandlers();
    await refreshAll();
  }

  document.addEventListener('DOMContentLoaded', init);
})(); 