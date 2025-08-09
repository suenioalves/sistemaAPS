console.log('adolescentes_analise.js carregado');

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
  let chartTypes = {
    abordagem: 'bar', // 'bar' | 'pie'
    resultado: 'pie',  // 'pie' | 'bar'
    metodo: 'pie'      // 'pie' | 'bar'
  };

  function qs(id){ return document.getElementById(id); }

  // Tema (dark mode) persistente
  function applyTheme(){
    const saved = localStorage.getItem('adolescentes_theme');
    const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDark);
  }
  function toggleTheme(){
    const isDark = document.documentElement.classList.contains('dark');
    const next = isDark ? 'light' : 'dark';
    localStorage.setItem('adolescentes_theme', next);
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
  function shareView(){
    const query = buildQuery();
    const url = location.origin + location.pathname + (query.toString() ? '?' + query.toString() : '');
    navigator.clipboard.writeText(url).then(()=>{
      console.log('URL copiada:', url);
      // TODO: mostrar toast/notificação
    });
  }

  // Utilitários
  function skeleton(show, id){
    const el = qs('skel-' + id);
    if(el) el.classList.toggle('hidden', !show);
  }

  function chips(){
    const container = qs('chips-container');
    if(!container) return;
    
    container.innerHTML = '';
    const chips = [];
    
    if(state.equipe && state.equipe !== 'Todas') chips.push({label: `Equipe: ${state.equipe}`, key: 'equipe'});
    if(state.microarea && state.microarea !== 'Todas as áreas') chips.push({label: `Área: ${state.microarea}`, key: 'microarea'});
    if(state.inicio) chips.push({label: `De: ${state.inicio}`, key: 'inicio'});
    if(state.fim) chips.push({label: `Até: ${state.fim}`, key: 'fim'});
    
    chips.forEach(chip => {
      const div = document.createElement('div');
      div.className = 'inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md';
      div.innerHTML = `${chip.label} <button class="ml-1 hover:bg-primary/20 rounded px-1" onclick="clearFilter('${chip.key}')">&times;</button>`;
      container.appendChild(div);
    });
  }

  window.clearFilter = function(key){
    if(key === 'equipe') { state.equipe = 'Todas'; qs('filtro-equipe').value = 'Todas'; }
    if(key === 'microarea') { state.microarea = 'Todas as áreas'; qs('filtro-agente').value = 'Todas as áreas'; }
    if(key === 'inicio') { state.inicio = null; qs('inicio').value = ''; }
    if(key === 'fim') { state.fim = null; qs('fim').value = ''; }
    chips();
    loadAll();
  };

  function updateUI(){
    if(qs('filtro-equipe')) qs('filtro-equipe').value = state.equipe;
    if(qs('filtro-agente')) qs('filtro-agente').value = state.microarea;
    if(qs('inicio')) qs('inicio').value = state.inicio || '';
    if(qs('fim')) qs('fim').value = state.fim || '';
    if(qs('granularidade')) qs('granularidade').value = state.granularidade;
  }

  // Carregamento de dados
  async function loadEquipes(){
    try {
      const resp = await fetch('/api/equipes_com_agentes_adolescentes');
      const data = await resp.json();
      const selectEquipe = qs('filtro-equipe');
      const selectAgente = qs('filtro-agente');
      
      console.log('Dados das equipes:', data); // Debug
      
      if(selectEquipe) {
        selectEquipe.innerHTML = '<option value="Todas">Todas as equipes</option>';
        
        // A API retorna um array de objetos com estrutura: {nome_equipe, agentes, num_adolescentes}
        data.forEach(equipe => {
          const opt = document.createElement('option');
          opt.value = equipe.nome_equipe;
          opt.textContent = `${equipe.nome_equipe} (${equipe.num_adolescentes} adolescentes)`;
          selectEquipe.appendChild(opt);
        });
      }
      
      // Salvar dados para filtrar agentes quando equipe for selecionada
      window.equipesData = data;
      
      // Adicionar event listener para mudanças na equipe
      if(selectEquipe) {
        selectEquipe.addEventListener('change', (e) => {
          const equipeSelecionada = e.target.value;
          state.equipe = equipeSelecionada;
          updateAgentes(equipeSelecionada);
          // Recarregar todos os dados com o novo filtro
          console.log('Equipe selecionada:', equipeSelecionada);
          chips();
          loadAll();
        });
      }
      
      // Carregar todos os agentes inicialmente
      updateAgentes('Todas');
      
    } catch(e) {
      console.error('Erro ao carregar equipes:', e);
    }
  }
  
  function updateAgentes(equipeSelecionada) {
    const selectAgente = qs('filtro-agente');
    if(!selectAgente || !window.equipesData) return;
    
    selectAgente.innerHTML = '<option value="Todas as áreas">Todas as áreas</option>';
    
    if(equipeSelecionada === 'Todas') {
      // Mostrar todos os agentes de todas as equipes
      window.equipesData.forEach(equipe => {
        equipe.agentes?.forEach(agente => {
          const opt = document.createElement('option');
          opt.value = `Área ${agente.micro_area} - Agente ${agente.nome_agente}`;
          opt.textContent = `Área ${agente.micro_area} - ${agente.nome_agente} (${equipe.nome_equipe})`;
          selectAgente.appendChild(opt);
        });
      });
    } else {
      // Mostrar apenas agentes da equipe selecionada
      const equipe = window.equipesData.find(eq => eq.nome_equipe === equipeSelecionada);
      equipe?.agentes?.forEach(agente => {
        const opt = document.createElement('option');
        opt.value = `Área ${agente.micro_area} - Agente ${agente.nome_agente}`;
        opt.textContent = `Área ${agente.micro_area} - ${agente.nome_agente}`;
        selectAgente.appendChild(opt);
      });
    }
    
    // Resetar microarea quando equipe muda
    state.microarea = 'Todas as áreas';
    
    // Remover event listener anterior e adicionar novo
    if(selectAgente) {
      // Remover listeners existentes
      const newSelect = selectAgente.cloneNode(true);
      selectAgente.parentNode.replaceChild(newSelect, selectAgente);
      
      // Adicionar novo event listener
      newSelect.addEventListener('change', (e) => {
        const microareaSelecionada = e.target.value;
        state.microarea = microareaSelecionada;
        console.log('Microárea selecionada:', microareaSelecionada);
        chips();
        loadAll();
      });
    }
  }

  async function loadKPIs(){
    try {
      skeleton(true, 'kpi-gestantes');
      skeleton(true, 'kpi-sem-metodo');
      skeleton(true, 'kpi-atraso');
      skeleton(true, 'kpi-em-dia');
      
      const params = new URLSearchParams();
      if(state.equipe !== 'Todas') params.set('equipe', state.equipe);
      if(state.microarea !== 'Todas as áreas') params.set('microarea', state.microarea);
      if(state.inicio) params.set('inicio', state.inicio);
      if(state.fim) params.set('fim', state.fim);
      
      const resp = await fetch('/api/adolescentes/analytics/status_snapshot?' + params);
      const data = await resp.json();
      
      if(qs('kpi-gestantes')) qs('kpi-gestantes').textContent = data.gestantes || 0;
      if(qs('kpi-sem-metodo')) qs('kpi-sem-metodo').textContent = data.sem_metodo || 0;
      if(qs('kpi-atraso')) qs('kpi-atraso').textContent = data.metodo_atraso || 0;
      if(qs('kpi-em-dia')) qs('kpi-em-dia').textContent = data.metodo_em_dia || 0;
      
    } catch(e) {
      console.error('Erro ao carregar KPIs:', e);
    } finally {
      skeleton(false, 'kpi-gestantes');
      skeleton(false, 'kpi-sem-metodo');
      skeleton(false, 'kpi-atraso');
      skeleton(false, 'kpi-em-dia');
    }
  }

  async function loadStatusChart(){
    skeleton(true, 'status');
    try {
      const params = new URLSearchParams();
      if(state.equipe !== 'Todas') params.set('equipe', state.equipe);
      if(state.microarea !== 'Todas as áreas') params.set('microarea', state.microarea);
      
      const resp = await fetch('/api/adolescentes/analytics/status_snapshot?' + params);
      const data = await resp.json();
      
      const chartData = [
        { name: 'Gestantes', value: data.gestantes || 0, color: '#ec4899' },
        { name: 'Sem método', value: data.sem_metodo || 0, color: '#ef4444' },
        { name: 'Método em atraso', value: data.metodo_atraso || 0, color: '#f59e0b' },
        { name: 'Método em dia', value: data.metodo_em_dia || 0, color: '#10b981' }
      ];
      
      createStatusChart(chartData);
    } catch(e) {
      console.error('Erro ao carregar chart de status:', e);
    } finally {
      skeleton(false, 'status');
    }
  }

  async function loadMixChart(){
    skeleton(true, 'mix');
    try {
      const params = new URLSearchParams();
      if(state.equipe !== 'Todas') params.set('equipe', state.equipe);
      if(state.microarea !== 'Todas as áreas') params.set('microarea', state.microarea);
      
      const resp = await fetch('/api/adolescentes/analytics/metodos_desejados?' + params);
      const data = await resp.json();
      
      const metodos = data.metodos || [];
      const labels = metodos.map(m => m.nome);
      const values = metodos.map(m => m.quantidade);
      const total = values.reduce((a, b) => a + b, 0);
      const percentages = values.map(v => total > 0 ? ((v / total) * 100) : 0);
      
      mixDataCache = { labels, valuesAbs: values, valuesPct: percentages, total };
      createMixChart();
      
    } catch(e) {
      console.error('Erro ao carregar chart de métodos:', e);
    } finally {
      skeleton(false, 'mix');
    }
  }

  async function loadAbordagemChart(){
    skeleton(true, 'abordagem');
    try {
      const params = new URLSearchParams();
      if(state.equipe !== 'Todas') params.set('equipe', state.equipe);
      if(state.microarea !== 'Todas as áreas') params.set('microarea', state.microarea);
      
      const resp = await fetch('/api/adolescentes/analytics/tipos_abordagem?' + params);
      const data = await resp.json();
      
      createAbordagemChart(data.abordagens || []);
    } catch(e) {
      console.error('Erro ao carregar chart de abordagem:', e);
    } finally {
      skeleton(false, 'abordagem');
    }
  }

  async function loadResultadoChart(){
    skeleton(true, 'resultado');
    try {
      const params = new URLSearchParams();
      if(state.equipe !== 'Todas') params.set('equipe', state.equipe);
      if(state.microarea !== 'Todas as áreas') params.set('microarea', state.microarea);
      
      const resp = await fetch('/api/adolescentes/analytics/resultados_abordagem?' + params);
      const data = await resp.json();
      
      createResultadoChart(data.resultados || []);
    } catch(e) {
      console.error('Erro ao carregar chart de resultado:', e);
    } finally {
      skeleton(false, 'resultado');
    }
  }

  async function loadMetodoChart(){
    skeleton(true, 'metodo');
    try {
      const params = new URLSearchParams();
      if(state.equipe !== 'Todas') params.set('equipe', state.equipe);
      if(state.microarea !== 'Todas as áreas') params.set('microarea', state.microarea);
      
      const resp = await fetch('/api/adolescentes/analytics/metodos_desejados?' + params);
      const data = await resp.json();
      
      createMetodoChart(data.metodos || []);
    } catch(e) {
      console.error('Erro ao carregar chart de método:', e);
    } finally {
      skeleton(false, 'metodo');
    }
  }

  async function loadTimelineChart(){
    skeleton(true, 'acoes');
    try {
      const params = new URLSearchParams();
      if(state.equipe !== 'Todas') params.set('equipe', state.equipe);
      if(state.microarea !== 'Todas as áreas') params.set('microarea', state.microarea);
      if(state.inicio) params.set('inicio', state.inicio);
      if(state.fim) params.set('fim', state.fim);
      params.set('granularidade', state.granularidade);
      
      const resp = await fetch('/api/adolescentes/analytics/timeline_acoes?' + params);
      const data = await resp.json();
      
      createTimelineChart(data.timeline || []);
    } catch(e) {
      console.error('Erro ao carregar timeline:', e);
    } finally {
      skeleton(false, 'acoes');
    }
  }

  // Criação dos gráficos
  function createStatusChart(data) {
    const container = qs('chart-status');
    if(!container) return;
    
    if(charts.status) {
      charts.status.dispose();
    }
    
    charts.status = echarts.init(container);
    
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#f3f4f6' : '#1f2937';
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: { color: textColor }
      },
      series: [
        {
          name: 'Status Contraceptivo',
          type: 'pie',
          radius: '50%',
          data: data.map(item => ({
            value: item.value,
            name: item.name,
            itemStyle: { color: item.color }
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
    
    charts.status.setOption(option);
  }

  function createMixChart() {
    const container = qs('chart-mix');
    if(!container || !mixDataCache.labels.length) return;
    
    if(charts.mix) {
      charts.mix.dispose();
    }
    
    charts.mix = echarts.init(container);
    
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#f3f4f6' : '#1f2937';
    
    const values = mixMode === 'pct' ? mixDataCache.valuesPct : mixDataCache.valuesAbs;
    const suffix = mixMode === 'pct' ? '%' : '';
    
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const value = mixMode === 'pct' ? 
            `${params.value.toFixed(1)}%` : 
            `${params.value} (${((params.value / mixDataCache.total) * 100).toFixed(1)}%)`;
          return `${params.name}: ${value}`;
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: { color: textColor }
      },
      series: [
        {
          name: 'Mix de Métodos',
          type: 'pie',
          radius: '50%',
          data: mixDataCache.labels.map((label, i) => ({
            value: values[i],
            name: label,
            itemStyle: { color: colors[i % colors.length] }
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
    
    charts.mix.setOption(option);
  }

  function createAbordagemChart(data) {
    const container = qs('chart-tipos-abordagem');
    if(!container) return;
    
    if(charts.abordagem) {
      charts.abordagem.dispose();
    }
    
    charts.abordagem = echarts.init(container);
    
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#f3f4f6' : '#1f2937';
    
    if(chartTypes.abordagem === 'pie') {
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          textStyle: { color: textColor }
        },
        series: [
          {
            name: 'Tipos de Abordagem',
            type: 'pie',
            radius: '50%',
            data: data.map((item, i) => ({
              value: item.quantidade,
              name: item.tipo,
              itemStyle: { color: colors[i % colors.length] }
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };
      
      charts.abordagem.setOption(option);
    } else {
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item.tipo),
          axisLabel: {
            color: textColor,
            rotate: 45,
            fontSize: 10
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: textColor }
        },
        series: [
          {
            name: 'Quantidade',
            type: 'bar',
            data: data.map(item => item.quantidade),
            itemStyle: {
              color: '#3b82f6'
            }
          }
        ]
      };
      
      charts.abordagem.setOption(option);
    }
  }

  function createResultadoChart(data) {
    const container = qs('chart-resultados-abordagem');
    if(!container) return;
    
    if(charts.resultado) {
      charts.resultado.dispose();
    }
    
    charts.resultado = echarts.init(container);
    
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#f3f4f6' : '#1f2937';
    
    if(chartTypes.resultado === 'pie') {
      const colors = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          textStyle: { color: textColor }
        },
        series: [
          {
            name: 'Resultados',
            type: 'pie',
            radius: '50%',
            data: data.map((item, i) => ({
              value: item.quantidade,
              name: item.resultado,
              itemStyle: { color: colors[i % colors.length] }
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };
      
      charts.resultado.setOption(option);
    } else {
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item.resultado),
          axisLabel: {
            color: textColor,
            rotate: 45,
            fontSize: 10
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: textColor }
        },
        series: [
          {
            name: 'Quantidade',
            type: 'bar',
            data: data.map(item => item.quantidade),
            itemStyle: {
              color: '#10b981'
            }
          }
        ]
      };
      
      charts.resultado.setOption(option);
    }
  }

  function createMetodoChart(data) {
    const container = qs('chart-metodos-desejados');
    if(!container) return;
    
    if(charts.metodo) {
      charts.metodo.dispose();
    }
    
    charts.metodo = echarts.init(container);
    
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#f3f4f6' : '#1f2937';
    
    if(chartTypes.metodo === 'pie') {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          textStyle: { color: textColor }
        },
        series: [
          {
            name: 'Mix de Métodos',
            type: 'pie',
            radius: '50%',
            data: data.map((item, i) => ({
              value: item.quantidade,
              name: item.nome,
              itemStyle: { color: colors[i % colors.length] }
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };
      
      charts.metodo.setOption(option);
    } else {
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item.nome),
          axisLabel: {
            color: textColor,
            rotate: 45,
            fontSize: 10
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: textColor }
        },
        series: [
          {
            name: 'Quantidade',
            type: 'bar',
            data: data.map(item => item.quantidade),
            itemStyle: {
              color: '#f59e0b'
            }
          }
        ]
      };
      
      charts.metodo.setOption(option);
    }
  }

  function createTimelineChart(data) {
    const container = qs('chart-acoes');
    if(!container) return;
    
    if(charts.timeline) {
      charts.timeline.dispose();
    }
    
    charts.timeline = echarts.init(container);
    
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#f3f4f6' : '#1f2937';
    
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.periodo),
        axisLabel: { color: textColor }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: textColor }
      },
      series: [
        {
          name: 'Ações',
          type: 'line',
          data: data.map(item => item.acoes),
          smooth: true,
          itemStyle: {
            color: '#3b82f6'
          },
          lineStyle: {
            color: '#3b82f6'
          },
          areaStyle: {
            color: 'rgba(59, 130, 246, 0.1)'
          }
        }
      ]
    };
    
    charts.timeline.setOption(option);
  }

  // Toggle Functions
  function toggleMixMode() {
    mixMode = mixMode === 'abs' ? 'pct' : 'abs';
    const btn = qs('toggle-mix-text');
    if(btn) {
      btn.textContent = mixMode === 'abs' ? 'Ver %' : 'Ver Abs';
    }
    createMixChart();
  }

  function toggleAbordagemType() {
    chartTypes.abordagem = chartTypes.abordagem === 'bar' ? 'pie' : 'bar';
    const btn = qs('toggle-abordagem-text');
    if(btn) {
      btn.textContent = chartTypes.abordagem === 'bar' ? 'Pizza' : 'Colunas';
    }
    loadAbordagemChart();
  }

  function toggleResultadoType() {
    chartTypes.resultado = chartTypes.resultado === 'pie' ? 'bar' : 'pie';
    const btn = qs('toggle-resultado-text');
    if(btn) {
      btn.textContent = chartTypes.resultado === 'pie' ? 'Colunas' : 'Pizza';
    }
    loadResultadoChart();
  }

  function toggleMetodoType() {
    chartTypes.metodo = chartTypes.metodo === 'pie' ? 'bar' : 'pie';
    const btn = qs('toggle-metodo-text');
    if(btn) {
      btn.textContent = chartTypes.metodo === 'pie' ? 'Colunas' : 'Pizza';
    }
    loadMetodoChart();
  }

  // Eventos
  function bindEvents(){
    qs('btn-darkmode')?.addEventListener('click', toggleTheme);
    qs('btn-share')?.addEventListener('click', shareView);
    
    qs('btn-aplicar')?.addEventListener('click', ()=>{
      // Os filtros de equipe e microarea já são gerenciados pelos dropdowns
      // Aqui só atualizamos data e granularidade
      state.inicio = qs('inicio')?.value || null;
      state.fim = qs('fim')?.value || null;
      state.granularidade = qs('granularidade')?.value || 'month';
      chips();
      loadAll();
    });
    
    qs('btn-limpar')?.addEventListener('click', ()=>{
      state.equipe = 'Todas';
      state.microarea = 'Todas as áreas';
      state.inicio = null;
      state.fim = null;
      state.granularidade = 'month';
      updateUI();
      updateAgentes('Todas'); // Resetar agentes
      chips();
      loadAll();
    });
    
    qs('granularidade')?.addEventListener('change', (e)=>{
      state.granularidade = e.target.value;
      loadTimelineChart();
    });

    // Toggle buttons
    qs('toggle-mix-mode')?.addEventListener('click', toggleMixMode);
    qs('toggle-abordagem-type')?.addEventListener('click', toggleAbordagemType);
    qs('toggle-resultado-type')?.addEventListener('click', toggleResultadoType);
    qs('toggle-metodo-type')?.addEventListener('click', toggleMetodoType);

    // Export buttons (implementar conforme necessidade)
    qs('export-status')?.addEventListener('click', ()=> exportChart('status'));
    qs('export-mix')?.addEventListener('click', ()=> exportChart('mix'));
    qs('export-abordagem')?.addEventListener('click', ()=> exportChart('abordagem'));
    qs('export-resultado')?.addEventListener('click', ()=> exportChart('resultado'));
    qs('export-metodo')?.addEventListener('click', ()=> exportChart('metodo'));
    qs('export-acoes')?.addEventListener('click', ()=> exportChart('timeline'));
  }

  function exportChart(chartName) {
    const chart = charts[chartName];
    if(chart) {
      const url = chart.getDataURL({
        type: 'png',
        backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff'
      });
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `adolescentes-${chartName}-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    }
  }

  function loadAll(){
    loadKPIs();
    loadStatusChart();
    loadMixChart();
    loadAbordagemChart();
    loadResultadoChart();
    loadMetodoChart();
    loadTimelineChart();
  }

  // Resize handler
  window.addEventListener('resize', ()=>{
    Object.values(charts).forEach(chart => chart && chart.resize());
  });

  // Inicialização
  document.addEventListener('DOMContentLoaded', ()=>{
    applyTheme();
    applyQuery();
    updateUI();
    chips();
    bindEvents();
    loadEquipes().then(()=> loadAll());
  });
})();