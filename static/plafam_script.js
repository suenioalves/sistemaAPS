console.log('plafam_script.js carregado');

// Variáveis globais
let allPacientes = [];
let equipeSelecionadaAtual = 'Todas';
let agenteSelecionadoAtual = 'Todas as áreas';
let currentStatusFilter = 'Todos';
let currentSearchTerm = '';
let currentSortValue = '';
let activeFilters = {};
let activeAplicacoesFilter = {};

// Função para obter status do acompanhamento (movida para escopo global)
function getAcompanhamentoStatus(paciente) {
    if (paciente.gestante) return 'gestante';
    if (!paciente.metodo) return 'sem_metodo';
    if (!paciente.data_aplicacao) return 'em_dia';

    const dataAplicacao = new Date(paciente.data_aplicacao);
    const hoje = new Date();
    const diffTime = hoje - dataAplicacao;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let limiteDias = Infinity;
    const metodoLower = paciente.metodo.toLowerCase();

    if (metodoLower.includes('pílula') || metodoLower.includes('mensal')) {
        limiteDias = 30;
    } else if (metodoLower.includes('trimestral')) {
        limiteDias = 90;
    } else if (metodoLower.includes('diu')) {
        limiteDias = 3650; // 10 anos = 3650 dias
    } else if (metodoLower.includes('implante')) {
        limiteDias = 1095; // 3 anos = 1095 dias
    }
    
    if (diffDays <= limiteDias) {
        return 'em_dia';
    } else {
        // Verificar se está atrasado há mais de 6 meses (180 dias)
        const diasAtraso = diffDays - limiteDias;
        return (diasAtraso > 180) ? 'atrasado_6_meses' : 'atrasado';
    }
}

// Função global para imprimir convites selecionados
function imprimirConvitesSelecionados() {
    const selectedIds = [];
    document.querySelectorAll('.print-checkbox:checked').forEach(checkbox => {
        selectedIds.push(checkbox.dataset.cns);
    });
    
    if (selectedIds.length === 0) {
        alert('Selecione pelo menos um paciente para imprimir os convites.');
        return;
    }
    
    console.log('Imprimindo convites para pacientes:', selectedIds);
    console.log('Total de pacientes em allPacientes:', allPacientes.length);
    
    // Filtrar pacientes selecionados dos dados carregados
    const pacientesParaImprimir = allPacientes.filter(p => {
        const cnsValue = p.cartao_sus || p.cod_paciente || 'sem-cns';
        const cnsValueStr = String(cnsValue);
        console.log('Comparando:', cnsValueStr, 'com selectedIds:', selectedIds);
        return selectedIds.includes(cnsValueStr);
    });
    
    console.log('Pacientes encontrados para impressão:', pacientesParaImprimir.length);
    
    if (pacientesParaImprimir.length > 0) {
        generateInvitePDF(pacientesParaImprimir);
    } else {
        console.error("Nenhum objeto paciente encontrado para os IDs selecionados.");
        console.log('Debug - selectedIds:', selectedIds);
        console.log('Debug - allPacientes sample:', allPacientes.slice(0, 2));
        alert("Ocorreu um erro ao encontrar os dados dos pacientes selecionados. Tente novamente.");
    }
}

// Função para gerar PDF dos convites (igual ao arquivo antigo)
function generateInvitePDF(pacientesSelecionados) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    const convitesPorPagina = 3;
    const pageHeight = 210;
    const pageWidth = 297;
    const margin = 10;
    const conviteWidth = (pageWidth - (margin * 2) - (margin * (convitesPorPagina - 1))) / convitesPorPagina;

    const metodos = [
        { title: 'DIU de Cobre', text: 'Um método SEM HORMÔNIO de longa duração (10 anos) - inserido na UBS em poucos minutos.' },
        { title: 'Injetáveis', text: 'Que previnem a gravidez por um período específico: Mensal ou Trimestral.' },
        { title: 'Pílulas Anticoncepcionais', text: 'Comprimidos diários que regulam o ciclo menstrual e previnem a gravidez.' },
        { title: 'Laqueadura ou Vasectomia', text: 'Método definitivo para acima de 21 anos, com ou sem filhos. Está sendo realizada no Hospital todo mês.' }
    ];

    pacientesSelecionados.forEach((paciente, index) => {
        const page = Math.floor(index / convitesPorPagina);
        const positionInPage = index % convitesPorPagina;
        const statusAcompanhamento = getAcompanhamentoStatus(paciente);

        if (positionInPage === 0 && page > 0) {
            doc.addPage();
        }

        const xStart = margin + (positionInPage * (conviteWidth + margin));
        let currentY = margin + 10;

        doc.setDrawColor(220, 220, 220);
        doc.rect(xStart, margin, conviteWidth, pageHeight - (margin * 2));

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor('#1D70B8');
        let tituloConvite = "Planejamento Familiar - Convite";
        if (statusAcompanhamento === 'atrasado') {
            tituloConvite = "Lembrete Importante";
        }
        // Para atrasado_6_meses usa o mesmo título do convite padrão
        doc.text(tituloConvite, xStart + conviteWidth / 2, currentY, { align: 'center' });

        currentY += 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor('#333333');
        const splitNome = doc.splitTextToSize(paciente.nome_paciente || 'Nome não informado', conviteWidth - 20);
        doc.text(splitNome, xStart + conviteWidth / 2, currentY, { align: 'center' });
        currentY += (splitNome.length * 5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor('#666666');
        doc.text(`CNS: ${paciente.cartao_sus || 'Não informado'}`, xStart + conviteWidth / 2, currentY, { align: 'center' });

        currentY += 5;
        doc.text(`Equipe ${paciente.nome_equipe || 'não informada'} - Agente: ${paciente.nome_agente || 'A definir'}`, xStart + conviteWidth / 2, currentY, { align: 'center' });

        currentY += 5;
        doc.setDrawColor(220, 220, 220);
        doc.line(xStart + 5, currentY, xStart + conviteWidth - 5, currentY);

        currentY += 8;
        doc.setFontSize(10);
        doc.setTextColor('#333333');

        if (statusAcompanhamento === 'atrasado') {
            doc.setFont("helvetica", "normal");
            doc.text("Esperamos que esteja bem. ", xStart + 10, currentY);
            currentY += 5;
            doc.setFont("helvetica", "bold");
            const textoNegrito1 = "Notamos que já se passaram mais de 7 dias desde a data prevista para a atualizar o seu anticoncepcional no posto de saúde. Sabemos que, com a correria do dia a dia, pode ser fácil esquecer, mas queremos reforçar a importância da continuidade do seu método contraceptivo para garantir sua saúde e bem-estar.";
            let splitTexto = doc.splitTextToSize(textoNegrito1, conviteWidth - 20);
            doc.text(splitTexto, xStart + 10, currentY);
            currentY += (splitTexto.length * 4.5) + 5;
            const textoNegrito2 = "Pedimos que compareça o quanto antes ao posto de saúde para realizar a atualização.";
            splitTexto = doc.splitTextToSize(textoNegrito2, conviteWidth - 20);
            doc.text(splitTexto, xStart + 10, currentY);
            currentY += (splitTexto.length * 4.5) + 5;
            doc.setFont("helvetica", "normal");
            const textoFinal = "Nossa equipe está à disposição para atendê-la e esclarecer qualquer dúvida que possa ter sobre o uso do medicamento. Caso tenha apresentado alguma reação ao anticoncepcional ou tenha decidido interromper seu uso, nossa equipe também está disponível para orientá-la sobre outras opções de métodos contraceptivos que possam ser mais adequados para você.";
            splitTexto = doc.splitTextToSize(textoFinal, conviteWidth - 20);
            doc.text(splitTexto, xStart + 10, currentY);
        } else if (statusAcompanhamento === 'atrasado_6_meses' || statusAcompanhamento === 'sem_metodo') {
            const textoConvite = "É com grande satisfação que convidamos você a participar do nosso programa de Planejamento Familiar na Unidade Básica de Saúde (UBS). Nosso objetivo é fornecer informações essenciais sobre métodos que possa evitar uma gravidez não planejada e promover a saúde reprodutiva das mulheres em nossa comunidade.";
            const splitTexto = doc.splitTextToSize(textoConvite, conviteWidth - 20);
            doc.text(splitTexto, xStart + 10, currentY);
            currentY += (splitTexto.length * 4.5) + 8;
            metodos.forEach(metodo => {
                doc.setFillColor('#1D70B8');
                doc.circle(xStart + 12, currentY - 1.5, 2.5, 'F');
                doc.setDrawColor('#FFFFFF');
                doc.setLineWidth(0.6);
                doc.line(xStart + 11.0, currentY - 1.5, xStart + 11.8, currentY - 0.5);
                doc.line(xStart + 11.8, currentY - 0.5, xStart + 13.0, currentY - 2.8);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(11);
                doc.setTextColor('#333333');
                doc.text(metodo.title, xStart + 18, currentY);
                currentY += 5;
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.setTextColor('#666666');
                const splitDesc = doc.splitTextToSize(metodo.text, conviteWidth - 28);
                doc.text(splitDesc, xStart + 18, currentY);
                currentY += (splitDesc.length * 4) + 5;
            });
        }
        let finalY = pageHeight - margin - 12;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor('#1D70B8');
        doc.text("Venha para sua consulta no seu posto.", xStart + conviteWidth / 2, finalY, { align: 'center' });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Não precisa tirar ficha antes.", xStart + conviteWidth / 2, finalY + 4, { align: 'center' });
    });
    doc.output('dataurlnewwindow');
}

// Função para calcular próxima aplicação
function calcularProximaAplicacao(paciente) {
    if (!paciente.data_aplicacao || paciente.gestante) return '';
    
    try {
        const dataAplicacao = new Date(paciente.data_aplicacao + 'T00:00:00');
        if (isNaN(dataAplicacao.getTime())) return '';
        
        const metodoLower = paciente.metodo ? paciente.metodo.toLowerCase() : '';
        let diasIntervalo = 0;
        
        if (metodoLower.includes('mensal') || metodoLower.includes('pílula')) {
            diasIntervalo = 30;
        } else if (metodoLower.includes('trimestral')) {
            diasIntervalo = 90;
        } else {
            return ''; // Métodos de longa duração não têm próxima aplicação definida
        }
        
        const proximaAplicacao = new Date(dataAplicacao);
        proximaAplicacao.setDate(proximaAplicacao.getDate() + diasIntervalo);
        
        return proximaAplicacao.toLocaleDateString('pt-BR');
    } catch (error) {
        return '';
    }
}

// Função para exportar dados (Excel, CSV, PDF) - busca TODOS os registros via API
function exportData(format) {
    // Construir parâmetros de busca baseados nos filtros atuais
    const params = new URLSearchParams();
    
    // Aplicar filtros atuais
    if (equipeSelecionadaAtual && equipeSelecionadaAtual !== 'Todas') {
        params.append('equipe', equipeSelecionadaAtual);
    }
    if (agenteSelecionadoAtual && agenteSelecionadoAtual !== 'Todas') {
        params.append('agente_selecionado', agenteSelecionadoAtual);
    }
    if (currentSearchTerm) {
        params.append('search', currentSearchTerm);
    }
    if (currentStatusFilter && currentStatusFilter !== 'Todos') {
        params.append('status_timeline', currentStatusFilter);  
    }
    
    // Aplicar filtros avançados se ativos
    if (activeFilters && Object.keys(activeFilters).length > 0) {
        Object.entries(activeFilters).forEach(([filterName, filterValues]) => {
            filterValues.forEach(value => {
                params.append(filterName, value);
            });
        });
    }
    
    // Aplicar filtros de aplicações se ativos
    if (activeAplicacoesFilter) {
        if (activeAplicacoesFilter.dataInicial) {
            params.append('aplicacao_data_inicial', activeAplicacoesFilter.dataInicial);
        }
        if (activeAplicacoesFilter.dataFinal) {
            params.append('aplicacao_data_final', activeAplicacoesFilter.dataFinal);
        }
        if (activeAplicacoesFilter.metodo) {
            params.append('aplicacao_metodo', activeAplicacoesFilter.metodo);
        }
    }
    
    // Mostrar loading
    const loadingMsg = document.createElement('div');
    loadingMsg.textContent = 'Preparando exportação...';
    loadingMsg.style.position = 'fixed';
    loadingMsg.style.top = '50%';
    loadingMsg.style.left = '50%';
    loadingMsg.style.transform = 'translate(-50%, -50%)';
    loadingMsg.style.background = 'white';
    loadingMsg.style.padding = '20px';
    loadingMsg.style.border = '1px solid #ccc';
    loadingMsg.style.zIndex = '9999';
    document.body.appendChild(loadingMsg);
    
    // Fazer requisição para buscar TODOS os dados
    fetch('/api/export_plafam?' + params.toString())
        .then(response => response.json())
        .then(allExportData => {
            // Remover loading
            document.body.removeChild(loadingMsg);
            
            if (!allExportData || allExportData.length === 0) {
                alert('Nenhum dado encontrado para exportar com os filtros atuais.');
                return;
            }
            
            // Preparar dados para exportação com as novas colunas
            const dataToExport = allExportData.map(p => {
                // Processar data da última aplicação
                let ultimaAplicacao = '';
                if (p.data_aplicacao) {
                    try {
                        // Se a data já está no formato DD/MM/YYYY, usar diretamente
                        if (p.data_aplicacao.includes('/')) {
                            ultimaAplicacao = p.data_aplicacao;
                        } else {
                            // Se está no formato YYYY-MM-DD, converter
                            const dateObj = new Date(p.data_aplicacao + 'T00:00:00');
                            if (!isNaN(dateObj.getTime())) {
                                ultimaAplicacao = dateObj.toLocaleDateString('pt-BR');
                            }
                        }
                    } catch (error) {
                        console.log('Erro ao processar data aplicação:', p.data_aplicacao, error);
                        ultimaAplicacao = '';
                    }
                }
                
                // Calcular próxima aplicação
                let proximaAplicacao = '';
                if (p.data_aplicacao && p.metodo) {
                    try {
                        let dataBase;
                        if (p.data_aplicacao.includes('/')) {
                            // Converter DD/MM/YYYY para Date
                            const partes = p.data_aplicacao.split('/');
                            dataBase = new Date(partes[2], partes[1] - 1, partes[0]);
                        } else {
                            dataBase = new Date(p.data_aplicacao + 'T00:00:00');
                        }
                        
                        if (!isNaN(dataBase.getTime())) {
                            const metodoLower = p.metodo.toLowerCase();
                            let diasSomar = 0;
                            
                            if (metodoLower.includes('mensal') || metodoLower.includes('pílula')) {
                                diasSomar = 30;
                            } else if (metodoLower.includes('trimestral')) {
                                diasSomar = 90;
                            } else if (metodoLower.includes('implante')) {
                                diasSomar = 1095; // 3 anos
                            } else if (metodoLower.includes('diu')) {
                                diasSomar = 3650; // 10 anos
                            }
                            
                            if (diasSomar > 0) {
                                const proximaData = new Date(dataBase);
                                proximaData.setDate(proximaData.getDate() + diasSomar);
                                proximaAplicacao = proximaData.toLocaleDateString('pt-BR');
                            }
                        }
                    } catch (error) {
                        console.log('Erro ao calcular próxima aplicação:', p.data_aplicacao, error);
                    }
                }
                
                return {
                    'Nome da Paciente': p.nome_paciente || '',
                    'CNS': p.cartao_sus || '',
                    'Idade': p.idade_calculada || '',
                    'Equipe': p.nome_equipe || '',
                    'Agente': p.nome_agente || 'A definir',
                    'Método Atual': p.metodo || 'Nenhum',
                    'Última Aplicação': ultimaAplicacao,
                    'Próxima Aplicação': proximaAplicacao
                };
            });
            
            // Ordenar por data da última aplicação (mais antiga para mais recente)
            dataToExport.sort((a, b) => {
                let dataA = new Date(0);
                let dataB = new Date(0);
                
                try {
                    if (a['Última Aplicação']) {
                        const partesA = a['Última Aplicação'].split('/');
                        if (partesA.length === 3) {
                            dataA = new Date(partesA[2], partesA[1] - 1, partesA[0]);
                        }
                    }
                } catch (e) {
                    dataA = new Date(0);
                }
                
                try {
                    if (b['Última Aplicação']) {
                        const partesB = b['Última Aplicação'].split('/');
                        if (partesB.length === 3) {
                            dataB = new Date(partesB[2], partesB[1] - 1, partesB[0]);
                        }
                    }
                } catch (e) {
                    dataB = new Date(0);
                }
                
                return dataA - dataB;
            });
            
            console.log(`Exportando ${dataToExport.length} registros para ${format}`);
            
            if (format === 'xlsx') {
                const { XLSX } = window;
                const worksheet = XLSX.utils.json_to_sheet(dataToExport);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Pacientes");
                XLSX.writeFile(workbook, `Plafam_Exportacao_Completa.xlsx`);
            } else if (format === 'csv') {
                const header = Object.keys(dataToExport[0]).join(';');
                const rows = dataToExport.map(row => Object.values(row).map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(';'));
                const csvContent = "data:text/csv;charset=utf-8," + "\uFEFF" + header + "\n" + rows.join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `Plafam_Exportacao_Completa.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (format === 'pdf') {
                exportPDF(dataToExport);
            }
        })
        .catch(error => {
            // Remover loading em caso de erro
            if (document.body.contains(loadingMsg)) {
                document.body.removeChild(loadingMsg);
            }
            console.error('Erro ao buscar dados para exportação:', error);
            alert('Erro ao preparar exportação. Tente novamente.');
        });
}

// Função para exportar PDF de relatório
function exportPDF(dataToExport) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Título principal
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text("Relatório de Pacientes - Planejamento Familiar", 14, 20);
    
    // Subtítulo com informações do filtro
    let subtitulo = `Total: ${dataToExport.length} mulheres`;
    
    // Verificar se há filtro de aplicações ativo
    if (activeAplicacoesFilter && activeAplicacoesFilter.dataInicial && activeAplicacoesFilter.dataFinal) {
        const dataInicialFormatada = new Date(activeAplicacoesFilter.dataInicial).toLocaleDateString('pt-BR');
        const dataFinalFormatada = new Date(activeAplicacoesFilter.dataFinal).toLocaleDateString('pt-BR');
        subtitulo += ` devem tomar o injetável trimestral entre os dias ${dataInicialFormatada} e ${dataFinalFormatada}`;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(60);
    doc.text(subtitulo, 14, 28);
    
    // Headers da tabela com as novas colunas
    const headers = [['Nome da Paciente', 'CNS', 'Idade', 'Equipe', 'Agente', 'Método Atual', 'Última Aplicação', 'Próxima Aplicação']];
    
    // Dados da tabela
    const body = dataToExport.map(p => [
        p['Nome da Paciente'],
        p['CNS'],
        p['Idade'],
        p['Equipe'],
        p['Agente'],
        p['Método Atual'],
        p['Última Aplicação'],
        p['Próxima Aplicação']
    ]);
    
    doc.autoTable({
        head: headers,
        body: body,
        startY: 35,
        theme: 'striped',
        headStyles: { fillColor: [29, 112, 184], fontSize: 8, fontStyle: 'bold' },
        styles: { 
            fontSize: 7, 
            cellPadding: 1.5,
            overflow: 'linebreak',
            cellWidth: 'wrap'
        },
        tableWidth: 'wrap',
        margin: { left: 8, right: 8 },
        columnStyles: {
            0: { cellWidth: 'auto', minCellWidth: 25 }, // Nome da Paciente
            1: { cellWidth: 'auto', minCellWidth: 18 }, // CNS
            2: { cellWidth: 'auto', minCellWidth: 8 },  // Idade
            3: { cellWidth: 'auto', minCellWidth: 18 }, // Equipe
            4: { cellWidth: 'auto', minCellWidth: 18 }, // Agente
            5: { cellWidth: 'auto', minCellWidth: 20 }, // Método Atual
            6: { cellWidth: 'auto', minCellWidth: 15 }, // Última Aplicação
            7: { cellWidth: 'auto', minCellWidth: 15 }  // Próxima Aplicação
        }
    });
    
    doc.save(`Plafam_Relatorio_Completo.pdf`);
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded executado');
    
    // Variáveis locais
    let todasEquipesComAgentes = [];
    let currentPage = 1;
    
    // Função para atualizar os cards do painel de controle
    function atualizarCardsPainelControle(estatisticas) {
        console.log('Atualizando cards com estatísticas:', estatisticas);
        
        const totalElement = document.getElementById('totalAdolescentesValor');
        const metodoDiaElement = document.getElementById('adolescentesMetodoDiaValor');
        const metodoAtrasadoElement = document.getElementById('adolescentesMetodoAtrasadoValor');
        const semMetodoElement = document.getElementById('adolescentesSemMetodoValor');
        const gestantesElement = document.getElementById('adolescentesGestantesValor');
        
        // A API usa nomes de campos padronizados para compatibilidade
        if (totalElement) totalElement.textContent = estatisticas.total_adolescentes || 0;
        if (metodoDiaElement) metodoDiaElement.textContent = estatisticas.adolescentes_metodo_em_dia || 0;
        if (metodoAtrasadoElement) metodoAtrasadoElement.textContent = estatisticas.adolescentes_metodo_atrasado || 0;
        if (semMetodoElement) semMetodoElement.textContent = estatisticas.adolescentes_sem_metodo || 0;
        if (gestantesElement) gestantesElement.textContent = estatisticas.adolescentes_gestantes || 0;
        
        console.log('Cards atualizados - Total:', estatisticas.total_adolescentes, 'Em dia:', estatisticas.adolescentes_metodo_em_dia, 'Atrasado:', estatisticas.adolescentes_metodo_atrasado);
    }
    
    // Função para buscar estatísticas
    function fetchEstatisticasPainelControle() {
        const params = new URLSearchParams({
            equipe: equipeSelecionadaAtual,
            microarea: agenteSelecionadoAtual
        });
        fetch('/api/estatisticas_painel_plafam?' + params.toString())
            .then(r => r.json())
            .then(estatisticas => atualizarCardsPainelControle(estatisticas))
            .catch(error => console.error('Erro ao buscar estatísticas:', error));
    }
    
    // Função para buscar pacientes
    function fetchPacientes() {
        const params = new URLSearchParams({
            equipe: equipeSelecionadaAtual,
            microarea: agenteSelecionadoAtual,
            page: currentPage,
            limit: 20,
            status_timeline: currentStatusFilter
        });
        
        console.log('fetchPacientes chamada com filtro:', currentStatusFilter);
        console.log('Parâmetros da requisição:', params.toString());
        
        fetch('/api/pacientes_plafam?' + params.toString())
            .then(response => response.json())
            .then(data => {
                console.log('Resposta da API pacientes:', data);
                if (data.erro) {
                    console.error('Erro ao buscar pacientes:', data.erro);
                    return;
                }
                
                allPacientes = data.pacientes || [];
                const totalPages = Math.ceil((data.total || 0) / 20);
                
                console.log('Pacientes recebidos:', allPacientes.length);
                renderPacientes(allPacientes);
                renderPagination(data.total || 0, currentPage, 20, totalPages);
            })
            .catch(error => console.error('Erro ao buscar pacientes:', error));
    }
    
    // Função para renderizar pacientes na tabela
    function renderPacientes(pacientes) {
        const tabelaBody = document.getElementById('tabela-pacientes-body');
        if (!tabelaBody) return;
        
        tabelaBody.innerHTML = '';
        
        if (pacientes.length === 0) {
            tabelaBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">Nenhum paciente encontrado</td></tr>';
            return;
        }
        
        pacientes.forEach(paciente => {
            const row = document.createElement('tr');
            row.className = 'table-row cursor-pointer hover:bg-gray-50';
            
            const status = getAcompanhamentoStatus(paciente);
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${paciente.nome_paciente || ''}</div>
                            <div class="text-xs text-gray-500">Cartão SUS: ${paciente.cartao_sus || ''}</div>
                            <div class="text-xs text-gray-500">Equipe ${paciente.nome_equipe || ''} - Agente: ${paciente.nome_agente || 'A definir'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${paciente.idade_calculada || 'N/A'} anos</td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    ${getMetodoContent(paciente)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${getProximaAcaoContent(paciente)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    ${getAcoesContent(paciente)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    ${getImprimirCellContent(paciente, status)}
                </td>
            `;
            
            tabelaBody.appendChild(row);
        });
        
        // Configurar event listeners para os menus de ações
        setupActionMenus();
    }

    // Função para obter conteúdo do método e status (similar ao painel de adolescentes)
    function getPlafamMetodoStatusContent(paciente) {
        let metodoTexto = paciente.metodo || 'Sem método';
        let statusTexto = '';
        let statusClass = 'text-gray-600';
        let metodoClass = 'text-gray-900';
        let containerClass = '';

        if (paciente.gestante) {
            metodoTexto = 'GESTANTE';
            statusTexto = paciente.data_provavel_parto ? `DPP: ${paciente.data_provavel_parto}` : 'DPP não informada';
            statusClass = 'text-pink-600 font-semibold';
            metodoClass = 'text-pink-700 font-bold';
            containerClass = 'border-2 border-pink-500 rounded-full px-3 py-1 inline-block bg-pink-50';
        } else if (!paciente.metodo) {
            metodoTexto = 'SEM MÉTODO';
            statusTexto = 'Não utiliza método contraceptivo.';
            statusClass = 'text-yellow-700';
            metodoClass = 'text-yellow-700 font-bold';
            containerClass = 'border-2 border-yellow-500 rounded-full px-3 py-1 inline-block bg-yellow-50';
        } else if (paciente.data_aplicacao) {
            const dataAplicacao = new Date(paciente.data_aplicacao + 'T00:00:00');
            
            if (isNaN(dataAplicacao.getTime())) {
                statusTexto = 'Data de aplicação inválida.';
                statusClass = 'text-red-500 font-semibold';
            } else {
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);

                let limiteDias = Infinity;
                const metodoLower = paciente.metodo.toLowerCase();
                
                // Determinar nome do método para exibição
                let nomeMetodoDisplay = '';
                if (metodoLower.includes('mensal') || metodoLower.includes('pílula')) {
                    limiteDias = 30;
                    nomeMetodoDisplay = metodoLower.includes('mensal') ? 'MENSAL' : 'PÍLULA';
                } else if (metodoLower.includes('trimestral')) {
                    limiteDias = 90;
                    nomeMetodoDisplay = 'TRIMESTRAL';
                } else if (metodoLower.includes('diu')) {
                    limiteDias = 3650; // 10 anos
                    nomeMetodoDisplay = 'DIU';
                } else if (metodoLower.includes('implante')) {
                    limiteDias = 1095; // 3 anos
                    nomeMetodoDisplay = 'IMPLANTE SUBDÉRMICO';
                } else if (metodoLower.includes('laqueadura') || metodoLower.includes('histerectomia')) {
                    nomeMetodoDisplay = metodoLower.includes('laqueadura') ? 'LAQUEADURA' : 'HISTERECTOMIA';
                } else {
                    nomeMetodoDisplay = paciente.metodo.toUpperCase();
                }

                const dataVencimento = new Date(dataAplicacao);
                dataVencimento.setDate(dataVencimento.getDate() + limiteDias);

                const dataAplicacaoFormatada = dataAplicacao.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

                if (limiteDias !== Infinity) { // Métodos com data de vencimento clara
                    if (hoje >= dataVencimento) {
                        // Método vencido
                        metodoTexto = nomeMetodoDisplay;
                        statusTexto = `Vencido desde: ${dataVencimento.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;
                        statusClass = 'text-red-600 font-semibold';
                        metodoClass = 'text-red-700 font-bold';
                        containerClass = 'border-2 border-red-500 rounded-full px-3 py-1 inline-block bg-red-50';
                    } else {
                        // Método em dia
                        metodoTexto = nomeMetodoDisplay;
                        statusTexto = `Em dia - Próx. dose/venc: ${dataVencimento.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;
                        statusClass = 'text-green-600';
                        metodoClass = 'text-green-700 font-bold';
                        containerClass = 'border-2 border-green-500 rounded-full px-3 py-1 inline-block bg-green-50';
                    }
                } else { // Métodos de longa duração sem data de vencimento clara (DIU, Implante, Laqueadura)
                    metodoTexto = nomeMetodoDisplay;
                    statusTexto = `Em uso desde: ${dataAplicacaoFormatada}`;
                    statusClass = 'text-green-600';
                    metodoClass = 'text-green-700 font-bold';
                    containerClass = 'border-2 border-green-500 rounded-full px-3 py-1 inline-block bg-green-50';
                }
            }
        } else { // Tem método mas não tem data de aplicação
            const metodoLower = paciente.metodo.toLowerCase();
            if (metodoLower.includes('laqueadura') || metodoLower.includes('histerectomia')) {
                // Métodos definitivos sem data são considerados válidos
                const nomeMetodoDisplay = metodoLower.includes('laqueadura') ? 'LAQUEADURA' : 'HISTERECTOMIA';
                metodoTexto = nomeMetodoDisplay;
                statusTexto = 'Método definitivo em uso.';
                statusClass = 'text-green-600';
                metodoClass = 'text-green-700 font-bold';
                containerClass = 'border-2 border-green-500 rounded-full px-3 py-1 inline-block bg-green-50';
            } else {
                statusTexto = 'Data de aplicação não informada.';
                statusClass = 'text-gray-500';
            }
        }

        if (containerClass) {
            return `
                <div class="${containerClass}">
                    <div class="text-sm font-bold ${metodoClass}">${metodoTexto}</div>
                </div>
                ${statusTexto ? `<div class="text-xs ${statusClass} mt-1">${statusTexto}</div>` : ''}
            `;
        } else {
            return `
                <div class="text-sm font-medium ${metodoClass}">${metodoTexto}</div>
                ${statusTexto ? `<div class="text-xs ${statusClass} mt-1">${statusTexto}</div>` : ''}
            `;
        }
    }

    // Funções mantidas para compatibilidade (agora são wrappers)
    function getMetodoContent(paciente) {
        return getPlafamMetodoStatusContent(paciente);
    }
    
    function getStatusContent(paciente, status) {
        return ''; // Status agora é incluído na função combinada
    }

    // Função para obter conteúdo da próxima ação
    function getProximaAcaoContent(paciente) {
        // Não exibir próxima ação para adolescentes (14-18 anos) - Planejamento Familiar Especial
        const idade = paciente.idade_calculada;
        if (idade >= 14 && idade <= 18) {
            return '';
        }
        // Implementar lógica de próxima ação se necessário
        return 'N/A';
    }
    
    // Mapa de status de acompanhamento (atualizado)
    const statusMap = {
        '0': { text: '', class: '' }, // Nenhuma ação
        '1': { text: 'Convite com o agente', class: 'status-com-agente' },
        '2': { text: 'Convite entregue ao cliente', class: 'status-entregue' },
        '3': { text: 'Deseja iniciar (via consulta)', class: 'status-compareceu' },
        '4': { text: 'Deseja iniciar (após convite)', class: 'status-domicilio' },
        '5': { text: 'Cliente não encontrado', class: 'status-nao-encontrado' },
        '6': { text: 'Particular', class: 'status-particular' },
        '7': { text: 'Reavaliar em 6 meses', class: 'status-reavaliar-6m' },
        '8': { text: 'Reavaliar em 1 ano', class: 'status-reavaliar-1a' },
        '9': { text: 'Fora de área', class: 'status-fora-area' }
    };

    // Função para obter conteúdo da célula de acompanhamento (igual ao arquivo antigo)
    function getAcompanhamentoCellContent(paciente, status) {
        // Não exibir menus de ações para adolescentes (14-18 anos) - Planejamento Familiar Especial
        const idade = paciente.idade_calculada;
        if (idade >= 14 && idade <= 18) {
            return '';
        }
        
        const isAtrasado = status === 'atrasado';
        const isAtrasado6Meses = status === 'atrasado_6_meses';
        const semMetodo = status === 'sem_metodo';
        const semCartaoSus = !paciente.cartao_sus || paciente.cartao_sus.trim() === '';
        
        // Exibir menu de ações para pacientes elegíveis: sem método, atrasado, atrasado 6+ meses, ou sem cartão SUS  
        if (!paciente.gestante && (semMetodo || isAtrasado || isAtrasado6Meses || semCartaoSus)) {
            const statusAcomp = paciente.status_acompanhamento;
            let statusBadge = '';
            if (statusAcomp && statusMap[statusAcomp]) {
                const { text, class: badgeClass } = statusMap[statusAcomp];
                const dataAcomp = paciente.data_acompanhamento ? ` (${paciente.data_acompanhamento})` : '';
                statusBadge = `<span class="acompanhamento-status-badge ${badgeClass}">${text}${dataAcomp}</span>`;
            }
            return `
                <div class="relative" data-cod-paciente="${paciente.cod_paciente}">
                    <button class="acompanhamento-btn inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-3 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                        Ações
                        <i class="ri-arrow-down-s-line -mr-1 ml-2 h-5 w-5"></i>
                    </button>
                    <div class="acompanhamento-dropdown origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden z-30" role="menu">
                        <div class="py-1" role="none">
                            <a href="#" class="acompanhamento-option text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-action="1">Convite com o agente</a>
                            <a href="#" class="acompanhamento-option text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-action="2">Convite entregue ao cliente</a>
                            <a href="#" class="acompanhamento-option text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-action="3">Deseja iniciar (via consulta)</a>
                            <a href="#" class="acompanhamento-option text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-action="4">Deseja iniciar (após convite)</a>
                            <a href="#" class="acompanhamento-option text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-action="5">Cliente não encontrado</a>
                            <a href="#" class="acompanhamento-option text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-action="6">Particular</a>
                            <a href="#" class="acompanhamento-option text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-action="7">Reavaliar em 6 meses</a>
                            <a href="#" class="acompanhamento-option text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-action="8">Reavaliar em 1 ano</a>
                            <a href="#" class="acompanhamento-option text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-action="9">Fora de área</a>
                            <div class="border-t my-1"></div>
                            <a href="#" class="acompanhamento-option text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-action="0">Nenhuma ação</a>
                        </div>
                    </div>
                    <div class="acompanhamento-status-container mt-1">${statusBadge}</div>
                </div>
            `;
        }
        return '';
    }
    
    // Função para obter conteúdo da célula de impressão (igual ao arquivo antigo)
    function getImprimirCellContent(paciente, status) {
        // Não exibir checkbox para adolescentes (14-18 anos) - Planejamento Familiar Especial
        const idade = paciente.idade_calculada;
        if (idade >= 14 && idade <= 18) {
            return '';
        }
        
        const isAtrasado = status === 'atrasado';
        const isAtrasado6Meses = status === 'atrasado_6_meses';
        const semMetodo = status === 'sem_metodo';
        const semCartaoSus = !paciente.cartao_sus || paciente.cartao_sus.trim() === '';
        
        // Exibir checkbox para pacientes elegíveis: sem método, atrasado, atrasado 6+ meses, ou sem cartão SUS
        if (!paciente.gestante && (semMetodo || isAtrasado || isAtrasado6Meses || semCartaoSus)) {
            const cnsValue = paciente.cartao_sus || paciente.cod_paciente || 'sem-cns';
            return `<input type="checkbox" class="print-checkbox h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" data-cns="${cnsValue}">`;
        }
        return '';
    }

    // Função para obter conteúdo das ações
    function getAcoesContent(paciente) {
        const status = getAcompanhamentoStatus(paciente);
        return getAcompanhamentoCellContent(paciente, status);
    }
    
    // Função auxiliar para adicionar ou remover a classe de destaque da linha
    function toggleRowSelectionStyle(checkboxElement) {
        const row = checkboxElement.closest('tr');
        if (row) {
            row.classList.toggle('row-selected', checkboxElement.checked);
        }
    }
    
    // Função para configurar menus de ações (simplificada, pois os event listeners são globais)
    function setupActionMenus() {
        // Event listeners são configurados globalmente no body da tabela
    }
    
    // Função para renderizar paginação
    function renderPagination(total, page, limit, totalPages) {
        const paginationContainer = document.getElementById('pagination-container');
        const paginationInfo = document.getElementById('pagination-info');
        
        if (!paginationContainer || !paginationInfo) return;
        
        paginationInfo.innerHTML = '';
        paginationContainer.innerHTML = '';

        if (!total || totalPages <= 0) return;

        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        paginationInfo.innerHTML = `Mostrando <span class="font-medium">${start}</span> a <span class="font-medium">${end}</span> de <span class="font-medium">${total}</span> pacientes`;

        let paginationHtml = '';
        // Botão Anterior
        paginationHtml += `<button data-page="${page - 1}" class="page-btn px-3 py-1 border border-gray-300 text-sm rounded-md ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}" ${page === 1 ? 'disabled' : ''}>Anterior</button>`;

        const pagesToShow = createPaginationLogic(page, totalPages);

        pagesToShow.forEach(p => {
            if (p === '...') {
                paginationHtml += `<span class="page-btn px-3 py-1 border-none text-sm rounded-md opacity-50 cursor-default">...</span>`;
            } else if (p === page) {
                paginationHtml += `<button data-page="${p}" class="page-btn px-3 py-1 border border-primary bg-primary text-white text-sm rounded-md">${p}</button>`;
            } else {
                paginationHtml += `<button data-page="${p}" class="page-btn px-3 py-1 border border-gray-300 text-sm rounded-md hover:bg-gray-100">${p}</button>`;
            }
        });
        // Botão Próximo
        paginationHtml += `<button data-page="${page + 1}" class="page-btn px-3 py-1 border border-gray-300 text-sm rounded-md ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}" ${page === totalPages ? 'disabled' : ''}>Próximo</button>`;

        paginationContainer.innerHTML = paginationHtml;

        document.querySelectorAll('.page-btn').forEach(button => {
            button.addEventListener('click', function () {
                if (this.disabled || this.dataset.page === undefined) return; // Ignora reticências e botões desabilitados
                currentPage = parseInt(this.dataset.page);
                // Usar função unificada que preserva filtros e ordenação
                fetchPacientesUnificado({ 
                    searchTerm: currentSearchTerm, 
                    sortValue: currentSortValue, 
                    includeFilters: Object.keys(activeFilters).length > 0,
                    includeAplicacoes: Object.keys(activeAplicacoesFilter).length > 0
                });
            });
        });
    }
    
    function createPaginationLogic(currentPage, totalPages) {
        let pages = [];
        const maxPagesToShow = 5; // Máximo de botões numéricos

        if (totalPages <= maxPagesToShow + 2) { // Se for 7 ou menos, mostra todos os números
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1); // Sempre mostra a primeira página
            if (currentPage > 3) {
                pages.push('...');
            }

            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }
            pages.push(totalPages); // Sempre mostra a última página
        }
        return pages;
    }
    
    // Função para atualizar o painel completo
    function atualizarPainelCompleto() {
        fetchEstatisticasPainelControle();
        fetchPacientes();
    }
    
    // Configurar abas de filtro de status
    function setupStatusFilterTabs() {
        console.log('setupStatusFilterTabs chamada');
        const statusFilterButtons = document.querySelectorAll('.timeline-status-tab-btn');
        console.log('Botões de filtro encontrados:', statusFilterButtons.length);
        
        statusFilterButtons.forEach((btn, index) => {
            console.log(`Configurando botão ${index}:`, btn.textContent, btn.getAttribute('data-status-filter'));
            btn.addEventListener('click', function() {
                console.log('Clique no botão:', this.textContent, 'status:', this.getAttribute('data-status-filter'));
                
                // Remove active state from all buttons
                statusFilterButtons.forEach(b => {
                    b.classList.remove('border-b-2', 'font-bold');
                    const activeBg = b.getAttribute('data-active-bg');
                    const activeText = b.getAttribute('data-active-text');
                    const activeBorder = b.getAttribute('data-active-border');
                    const inactiveBg = b.getAttribute('data-inactive-bg');
                    const inactiveText = b.getAttribute('data-inactive-text');
                    const inactiveBorder = b.getAttribute('data-inactive-border');
                    
                    // Remover classes ativas (separar por espaços se necessário)
                    if (activeBg) activeBg.split(' ').forEach(cls => cls.trim() && b.classList.remove(cls.trim()));
                    if (activeText) activeText.split(' ').forEach(cls => cls.trim() && b.classList.remove(cls.trim()));
                    if (activeBorder) activeBorder.split(' ').forEach(cls => cls.trim() && b.classList.remove(cls.trim()));
                    
                    // Adicionar classes inativas (separar por espaços se necessário)
                    if (inactiveBg) inactiveBg.split(' ').forEach(cls => cls.trim() && b.classList.add(cls.trim()));
                    if (inactiveText) inactiveText.split(' ').forEach(cls => cls.trim() && b.classList.add(cls.trim()));
                    if (inactiveBorder) inactiveBorder.split(' ').forEach(cls => cls.trim() && b.classList.add(cls.trim()));
                });
                
                // Add active state to clicked button
                this.classList.add('border-b-2', 'font-bold');
                const activeBg = this.getAttribute('data-active-bg');
                const activeText = this.getAttribute('data-active-text');
                const activeBorder = this.getAttribute('data-active-border');
                
                // Remover classes inativas do botão clicado (separar por espaços)
                const inactiveBgThis = this.getAttribute('data-inactive-bg');
                const inactiveTextThis = this.getAttribute('data-inactive-text');
                const inactiveBorderThis = this.getAttribute('data-inactive-border');
                
                if (inactiveBgThis) inactiveBgThis.split(' ').forEach(cls => cls.trim() && this.classList.remove(cls.trim()));
                if (inactiveTextThis) inactiveTextThis.split(' ').forEach(cls => cls.trim() && this.classList.remove(cls.trim()));
                if (inactiveBorderThis) inactiveBorderThis.split(' ').forEach(cls => cls.trim() && this.classList.remove(cls.trim()));
                
                // Adicionar classes ativas (separar por espaços)
                if (activeBg) activeBg.split(' ').forEach(cls => cls.trim() && this.classList.add(cls.trim()));
                if (activeText) activeText.split(' ').forEach(cls => cls.trim() && this.classList.add(cls.trim()));
                if (activeBorder) activeBorder.split(' ').forEach(cls => cls.trim() && this.classList.add(cls.trim()));
                
                // Update current filter and refresh data
                currentStatusFilter = this.getAttribute('data-status-filter');
                console.log('Filtro atualizado para:', currentStatusFilter);
                currentPage = 1;
                
                // Aplicar ordenação automática baseada no filtro selecionado
                let autoSortValue = currentSortValue; // Manter ordenação atual como padrão
                
                if (currentStatusFilter === 'MetodoEmDia') {
                    // Para métodos em dia: mostrar datas mais próximas de hoje primeiro (ex: 5/8/25, 8/8/25, 10/10/25...)
                    autoSortValue = 'metodo_asc'; // Usar a ordenação condicional já implementada
                    console.log('Aplicando ordenação automática para métodos em dia');
                } else if (currentStatusFilter === 'MetodoVencido') {
                    // Para métodos em atraso: mostrar datas mais próximas de hoje primeiro (ex: 30/7/25, 15/7/25, 1/5/25...)
                    autoSortValue = 'metodo_asc'; // Usar a ordenação condicional já implementada
                    console.log('Aplicando ordenação automática para métodos vencidos');
                }
                
                // Atualizar ordenação atual se foi alterada automaticamente
                if (autoSortValue !== currentSortValue) {
                    currentSortValue = autoSortValue;
                    // Atualizar texto do botão de ordenação se existir
                    const sortBtnText = document.getElementById('sort-btn-text');
                    if (sortBtnText && autoSortValue === 'metodo_asc') {
                        sortBtnText.textContent = 'Método';
                    }
                }
                
                // Usar função unificada que preserva filtros e ordenação
                fetchPacientesUnificado({ 
                    searchTerm: currentSearchTerm, 
                    sortValue: autoSortValue, 
                    includeFilters: Object.keys(activeFilters).length > 0,
                    includeAplicacoes: Object.keys(activeAplicacoesFilter).length > 0
                });
            });
        });
        
        // Set initial active state
        const todosButton = document.getElementById('timeline-filter-todos');
        if (todosButton) {
            console.log('Configurando estado inicial do botão Todos');
            todosButton.classList.add('border-b-2', 'font-bold');
            const activeBg = todosButton.getAttribute('data-active-bg');
            const activeText = todosButton.getAttribute('data-active-text');
            const activeBorder = todosButton.getAttribute('data-active-border');
            // Adicionar classes ativas ao estado inicial (separar por espaços)
            if (activeBg) activeBg.split(' ').forEach(cls => cls.trim() && todosButton.classList.add(cls.trim()));
            if (activeText) activeText.split(' ').forEach(cls => cls.trim() && todosButton.classList.add(cls.trim()));
            if (activeBorder) activeBorder.split(' ').forEach(cls => cls.trim() && todosButton.classList.add(cls.trim()));
        } else {
            console.error('Botão "Todos" não encontrado');
        }
    }
    
    // Função para popular dropdown de agentes
    function popularDropdownAgentes(agentes) {
        console.log('popularDropdownAgentes chamada com:', agentes);
        const microareaDropdownContent = document.getElementById('microareaDropdownContent');
        const microareaButtonText = document.getElementById('microareaButtonText');
        const microareaDropdown = document.getElementById('microareaDropdown');
        
        if (!microareaDropdownContent || !microareaButtonText || !microareaDropdown) {
            console.error('Elementos do dropdown microárea não encontrados');
            return;
        }
        
        microareaDropdownContent.innerHTML = '';
        const todasAgenciasOption = document.createElement('div');
        todasAgenciasOption.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
        todasAgenciasOption.textContent = 'Todas as áreas';
        todasAgenciasOption.addEventListener('click', () => {
            microareaButtonText.textContent = 'Todas as áreas';
            agenteSelecionadoAtual = 'Todas as áreas';
            microareaDropdown.classList.add('hidden');
            atualizarPainelCompleto();
        });
        microareaDropdownContent.appendChild(todasAgenciasOption);
        
        if (agentes && agentes.length > 0) {
            agentes.forEach(agente => {
                const option = document.createElement('div');
                option.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
                const displayText = `Área ${agente.micro_area} - ${agente.nome_agente}`;
                option.textContent = displayText;
                option.addEventListener('click', () => {
                    microareaButtonText.textContent = displayText;
                    agenteSelecionadoAtual = displayText;
                    microareaDropdown.classList.add('hidden');
                    atualizarPainelCompleto();
                });
                microareaDropdownContent.appendChild(option);
            });
            console.log('Dropdown agentes populado com', agentes.length, 'agentes');
            } else {
            microareaButtonText.textContent = 'Nenhuma área/agente';
            console.log('Nenhum agente encontrado para popular dropdown');
        }
    }
    
    // Função para buscar equipes e agentes
    function fetchEquipesEAgentes() {
        console.log('fetchEquipesEAgentes iniciada');
        fetch('/api/equipes_com_agentes_plafam')
            .then(response => {
                console.log('Resposta do endpoint:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('Dados recebidos:', data);
                const equipeDropdownContent = document.getElementById('equipeDropdownContent');
                const equipeButtonText = document.getElementById('equipeButtonText');
                const equipeDropdown = document.getElementById('equipeDropdown');
                const microareaButtonText = document.getElementById('microareaButtonText');
                const nomeEquipeSelecionadaDisplay = document.getElementById('nomeEquipeSelecionadaDisplay');
                
                if (!equipeDropdownContent || !equipeButtonText || !equipeDropdown) {
                    console.error('Elementos do dropdown equipe não encontrados');
                    return;
                }
                
                if (data.erro) {
                    console.error('Erro ao buscar equipes e agentes:', data.erro);
                    return;
                }
                
                todasEquipesComAgentes = data;
                equipeDropdownContent.innerHTML = '';
                const todasEquipesOption = document.createElement('div');
                todasEquipesOption.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
                todasEquipesOption.textContent = 'Todas as equipes';
                todasEquipesOption.addEventListener('click', () => {
                    equipeButtonText.textContent = 'Todas as equipes';
                    if (nomeEquipeSelecionadaDisplay) nomeEquipeSelecionadaDisplay.textContent = 'Todas as Equipes';
                    equipeSelecionadaAtual = 'Todas';
                    equipeDropdown.classList.add('hidden');
                    popularDropdownAgentes([]);
                    microareaButtonText.textContent = 'Todas as áreas';
                    agenteSelecionadoAtual = 'Todas as áreas';
                    atualizarPainelCompleto();
                });
                equipeDropdownContent.appendChild(todasEquipesOption);
                
                if (data && data.length > 0) {
                    data.forEach(equipe => {
                        const option = document.createElement('div');
                        option.className = 'cursor-pointer hover:bg-gray-100 p-2 rounded';
                        option.textContent = equipe.nome_equipe;
                        option.addEventListener('click', () => {
                            equipeButtonText.textContent = equipe.nome_equipe;
                            if (nomeEquipeSelecionadaDisplay) nomeEquipeSelecionadaDisplay.textContent = `Equipe ${equipe.nome_equipe}`;
                            equipeSelecionadaAtual = equipe.nome_equipe;
                            equipeDropdown.classList.add('hidden');
                            popularDropdownAgentes(equipe.agentes);
                            microareaButtonText.textContent = 'Todas as áreas';
                            agenteSelecionadoAtual = 'Todas as áreas';
                            atualizarPainelCompleto();
                        });
                        equipeDropdownContent.appendChild(option);
                    });
                    console.log('Dropdown equipes populado com', data.length, 'equipes');
                } else {
                    console.log('Nenhuma equipe encontrada');
                }
                
                atualizarPainelCompleto();
            })
            .catch(error => {
                console.error('Erro ao buscar equipes e agentes:', error);
            });
    }
    
    // Configurar dropdowns
    const equipeButton = document.getElementById('equipeButton');
    const equipeDropdown = document.getElementById('equipeDropdown');
    const microareaButton = document.getElementById('microareaButton');
    const microareaDropdown = document.getElementById('microareaDropdown');

    console.log('Elementos encontrados:', { equipeButton, equipeDropdown, microareaButton, microareaDropdown });

    if (equipeButton && equipeDropdown) {
        equipeButton.addEventListener('click', () => {
            equipeDropdown.classList.toggle('hidden');
            if (microareaDropdown) microareaDropdown.classList.add('hidden');
        });
    }

    if (microareaButton && microareaDropdown) {
        microareaButton.addEventListener('click', () => {
            microareaDropdown.classList.toggle('hidden');
            if (equipeDropdown) equipeDropdown.classList.add('hidden');
        });
    }

    // Fechar dropdowns ao clicar fora
    document.addEventListener('click', (e) => {
        if (equipeButton && equipeDropdown && !equipeButton.contains(e.target) && !equipeDropdown.contains(e.target)) {
            equipeDropdown.classList.add('hidden');
        }
        if (microareaButton && microareaDropdown && !microareaButton.contains(e.target) && !microareaDropdown.contains(e.target)) {
            microareaDropdown.classList.add('hidden');
        }
    });
    
    // Função melhorada para buscar pacientes que unifica busca, filtros e ordenação
    function fetchPacientesUnificado(options = {}) {
        const { 
            searchTerm = '', 
            sortValue = '', 
            includeFilters = false,
            includeAplicacoes = false 
        } = options;
        
        console.log('fetchPacientesUnificado chamada com:', { searchTerm, sortValue, includeFilters });
        
        const params = new URLSearchParams({
            equipe: equipeSelecionadaAtual,
            microarea: agenteSelecionadoAtual,
            page: currentPage,
            limit: 20,
            status_timeline: currentStatusFilter
        });
        
        // Adicionar busca se fornecida ou usar global
        const finalSearchTerm = searchTerm || currentSearchTerm;
        if (finalSearchTerm) {
            params.append('search', finalSearchTerm);
        }
        
        // Adicionar ordenação se fornecida ou usar global
        const finalSortValue = sortValue || currentSortValue;
        if (finalSortValue) {
            params.append('sort_by', finalSortValue);
        }
        
        // Adicionar filtros se solicitado
        if (includeFilters) {
            const filterDropdown = document.getElementById('filter-dropdown');
            if (filterDropdown) {
                const metodos = Array.from(filterDropdown.querySelectorAll('input[name="metodo"]:checked')).map(cb => cb.value);
                const faixasEtarias = Array.from(filterDropdown.querySelectorAll('input[name="faixa_etaria"]:checked')).map(cb => cb.value);
                const status = Array.from(filterDropdown.querySelectorAll('input[name="status"]:checked')).map(cb => cb.value);
                
                metodos.forEach(metodo => params.append('metodo', metodo));
                faixasEtarias.forEach(faixa => params.append('faixa_etaria', faixa));
                status.forEach(st => params.append('status', st));
            }
        }
        
        // Adicionar filtros de aplicações se solicitado
        if (includeAplicacoes && activeAplicacoesFilter.dataInicial && activeAplicacoesFilter.dataFinal) {
            params.append('aplicacao_data_inicial', activeAplicacoesFilter.dataInicial);
            params.append('aplicacao_data_final', activeAplicacoesFilter.dataFinal);
            params.append('aplicacao_metodo', activeAplicacoesFilter.metodo);
        }
        
        console.log('Parâmetros da requisição:', params.toString());
        
        fetch('/api/pacientes_plafam?' + params.toString())
            .then(response => response.json())
            .then(data => {
                console.log('Resposta da API:', data);
                if (data.erro) {
                    console.error('Erro ao buscar pacientes:', data.erro);
                    return;
                }
                
                allPacientes = data.pacientes || [];
                const totalPages = Math.ceil((data.total || 0) / 20);
                
                renderPacientes(allPacientes);
                renderPagination(data.total || 0, currentPage, 20, totalPages);
            })
            .catch(error => console.error('Erro ao buscar pacientes:', error));
    }
    
    // Configurar abas de filtro
    setupStatusFilterTabs();
    
    // Event listeners para menus de acompanhamento (igual ao arquivo antigo)
    const tabelaBody = document.getElementById('tabela-pacientes-body');
    if (tabelaBody) {
        tabelaBody.addEventListener('click', function (event) {
            const row = event.target.closest('tr');
            if (!row) return;

            if (event.target.closest('.acompanhamento-btn')) {
                const menu = event.target.closest('.relative').querySelector('.acompanhamento-dropdown');

                const rect = menu.getBoundingClientRect();
                if (window.innerHeight < rect.bottom) {
                    menu.classList.add('bottom-full', 'mb-2');
                    menu.classList.remove('top-full', 'mt-2');
                } else {
                    menu.classList.add('top-full', 'mt-2');
                    menu.classList.remove('bottom-full', 'mb-2');
                }

                document.querySelectorAll('.acompanhamento-dropdown').forEach(m => {
                    if (m !== menu) m.classList.add('hidden');
                });
                menu.classList.toggle('hidden');
                return;
            }

            if (event.target.classList.contains('acompanhamento-option')) {
                event.preventDefault();
                const actionStatus = event.target.dataset.action;
                const codCidadao = event.target.closest('[data-cod-paciente]').dataset.codPaciente;
                const statusContainer = event.target.closest('.relative').querySelector('.acompanhamento-status-container');

                fetch('/api/update_acompanhamento', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        co_cidadao: codCidadao,
                        status: actionStatus
                    }),
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.sucesso) {
                            if (actionStatus === '0') {
                                statusContainer.innerHTML = '';
                            } else {
                                const { text, class: badgeClass } = statusMap[actionStatus];
                                const dataAtual = new Date().toLocaleDateString('pt-BR');
                                statusContainer.innerHTML = `<span class="acompanhamento-status-badge ${badgeClass}">${text} (${dataAtual})</span>`;
                            }
                        } else {
                            alert('Falha ao atualizar o status: ' + data.erro);
                        }
                    })
                    .catch(error => {
                        console.error('Erro:', error);
                        alert('Ocorreu um erro de comunicação com o servidor.');
                    });

                event.target.closest('.acompanhamento-dropdown').classList.add('hidden');
                return;
            }

            // Lógica para o checkbox de impressão (igual ao arquivo antigo)
            const checkbox = row.querySelector('.print-checkbox');
            if (checkbox) {
                // Se o clique foi na linha, mas NÃO diretamente no próprio checkbox
                if (event.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                    // Atualiza o estilo da linha imediatamente após a mudança programática do checkbox
                    toggleRowSelectionStyle(checkbox);
                }
                // Se o clique foi DIRETAMENTE no checkbox, o navegador já alterou o estado
                // e o evento 'change' será disparado nativamente (tratado abaixo),
                // que também chamará toggleRowSelectionStyle.
            }
        });

        // Event listener para mudanças nos checkboxes
        tabelaBody.addEventListener('change', function (event) {
            if (event.target.classList.contains('print-checkbox')) {
                toggleRowSelectionStyle(event.target); // event.target aqui é o checkbox
            }
        });
    }
    
    // Configurar busca de pacientes
    const searchInput = document.getElementById('search-input');
    console.log('Elemento de busca encontrado:', searchInput);
    if (searchInput) {
        console.log('Configurando event listener para busca');
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim();
            console.log('Busca digitada:', searchTerm);
            currentSearchTerm = searchTerm; // Armazenar globalmente
            currentPage = 1; // Resetar para primeira página
            // Chamar função unificada preservando filtros ativos
            fetchPacientesUnificado({ 
                searchTerm,
                includeFilters: Object.keys(activeFilters).length > 0,
                includeAplicacoes: Object.keys(activeAplicacoesFilter).length > 0
            });
        });
    } else {
        console.error('Elemento search-input não encontrado!');
    }
    
    // Configurar dropdown de controle de aplicações
    const controleAplicacoesBtn = document.getElementById('controle-aplicacoes-btn');
    const controleAplicacoesDropdown = document.getElementById('controle-aplicacoes-dropdown');
    const applyAplicacoesBtn = document.getElementById('apply-aplicacoes-btn');
    const clearAplicacoesBtn = document.getElementById('clear-aplicacoes-btn');
    
    if (controleAplicacoesBtn && controleAplicacoesDropdown) {
        controleAplicacoesBtn.addEventListener('click', function() {
            controleAplicacoesDropdown.classList.toggle('hidden');
            // Fechar outros dropdowns
            if (filterDropdown) filterDropdown.classList.add('hidden');
            if (sortDropdown) sortDropdown.classList.add('hidden');
            if (exportDropdown) exportDropdown.classList.add('hidden');
        });
    }
    
    if (applyAplicacoesBtn) {
        applyAplicacoesBtn.addEventListener('click', function() {
            const dataInicial = document.getElementById('data-inicial-aplicacao').value;
            const dataFinal = document.getElementById('data-final-aplicacao').value;
            const metodo = document.getElementById('metodo-aplicacao-select').value;
            
            if (!dataInicial || !dataFinal) {
                alert('Por favor, selecione as datas inicial e final.');
                return;
            }
            
            if (new Date(dataInicial) > new Date(dataFinal)) {
                alert('A data inicial deve ser anterior à data final.');
                return;
            }
            
            // Armazenar filtro de aplicações ativo
            activeAplicacoesFilter = {
                dataInicial,
                dataFinal,
                metodo
            };
            
            currentPage = 1;
            fetchPacientesUnificado({ includeAplicacoes: true });
            if (controleAplicacoesDropdown) controleAplicacoesDropdown.classList.add('hidden');
        });
    }
    
    if (clearAplicacoesBtn) {
        clearAplicacoesBtn.addEventListener('click', function() {
            // Limpar campos
            document.getElementById('data-inicial-aplicacao').value = '';
            document.getElementById('data-final-aplicacao').value = '';
            document.getElementById('metodo-aplicacao-select').value = 'trimestral';
            // Limpar filtro ativo
            activeAplicacoesFilter = {};
            currentPage = 1;
            fetchPacientesUnificado({ includeAplicacoes: false });
        });
    }
    
    // Configurar dropdown de filtros
    const filterBtn = document.getElementById('filter-btn');
    const filterDropdown = document.getElementById('filter-dropdown');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    
    if (filterBtn && filterDropdown) {
        filterBtn.addEventListener('click', function() {
            filterDropdown.classList.toggle('hidden');
        });
    }
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            // Armazenar filtros ativos globalmente
            activeFilters = {};
            document.querySelectorAll('#filter-dropdown input[type="checkbox"]:checked').forEach(cb => {
                const name = cb.name;
                const value = cb.value;
                if (!activeFilters[name]) {
                    activeFilters[name] = [];
                }
                activeFilters[name].push(value);
            });
            
            currentPage = 1;
            fetchPacientesUnificado({ 
                includeFilters: true,
                includeAplicacoes: Object.keys(activeAplicacoesFilter).length > 0
            });
            if (filterDropdown) filterDropdown.classList.add('hidden');
        });
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            // Limpar todos os checkboxes
            const checkboxes = filterDropdown.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);
            // Limpar filtros ativos
            activeFilters = {};
            currentPage = 1;
            fetchPacientesUnificado({ includeFilters: false });
        });
    }
    
    // Configurar dropdown de ordenação
    const sortBtn = document.getElementById('sort-btn');
    const sortDropdown = document.getElementById('sort-dropdown');
    const sortOptions = document.querySelectorAll('.sort-option');
    const sortBtnText = document.getElementById('sort-btn-text');
    
    if (sortBtn && sortDropdown) {
        sortBtn.addEventListener('click', function() {
            sortDropdown.classList.toggle('hidden');
        });
    }
    
    if (sortOptions) {
        sortOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                const sortValue = this.getAttribute('data-sort');
                const sortText = this.getAttribute('data-text');
                
                currentSortValue = sortValue; // Armazenar globalmente
                if (sortBtnText) sortBtnText.textContent = sortText;
                if (sortDropdown) sortDropdown.classList.add('hidden');
                
                currentPage = 1;
                fetchPacientesUnificado({ 
                    sortValue,
                    includeFilters: Object.keys(activeFilters).length > 0,
                    includeAplicacoes: Object.keys(activeAplicacoesFilter).length > 0
                });
            });
        });
    }
    
    
    // Configurar botões de exportação
    const exportBtn = document.getElementById('export-btn');
    const exportDropdown = document.getElementById('export-dropdown');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    
    if (exportBtn && exportDropdown) {
        exportBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            exportDropdown.classList.toggle('hidden');
            // Fechar outros dropdowns
            if (filterDropdown) filterDropdown.classList.add('hidden');
            if (sortDropdown) sortDropdown.classList.add('hidden');
        });
    }
    
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportData('xlsx');
            if (exportDropdown) exportDropdown.classList.add('hidden');
        });
    }
    
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportData('csv');
            if (exportDropdown) exportDropdown.classList.add('hidden');
        });
    }
    
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportData('pdf');
            if (exportDropdown) exportDropdown.classList.add('hidden');
        });
    }
    
    // Atualizar o event listener para fechar dropdowns ao clicar fora
    document.addEventListener('click', function(e) {
        if (controleAplicacoesBtn && controleAplicacoesDropdown && !controleAplicacoesBtn.contains(e.target) && !controleAplicacoesDropdown.contains(e.target)) {
            controleAplicacoesDropdown.classList.add('hidden');
        }
        if (filterBtn && filterDropdown && !filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
            filterDropdown.classList.add('hidden');
        }
        if (sortBtn && sortDropdown && !sortBtn.contains(e.target) && !sortDropdown.contains(e.target)) {
            sortDropdown.classList.add('hidden');
        }
        if (exportBtn && exportDropdown && !exportBtn.contains(e.target) && !exportDropdown.contains(e.target)) {
            exportDropdown.classList.add('hidden');
        }
        // Fechar menus de acompanhamento ao clicar fora
        if (!e.target.closest('.acompanhamento-btn')) {
            document.querySelectorAll('.acompanhamento-dropdown').forEach(m => m.classList.add('hidden'));
        }
    });
    
    console.log('Chamando fetchEquipesEAgentes...');
    fetchEquipesEAgentes();
    console.log('Chamando fetchEstatisticasPainelControle...');
    fetchEstatisticasPainelControle();
});
