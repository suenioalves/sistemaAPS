document.addEventListener('DOMContentLoaded', function () {
    // Inicializa as bibliotecas JS necessárias, se existirem no objeto window
    const { jsPDF } = window.jspdf;
    const { XLSX } = window;

    // --- Seletores de Elementos ---
    const teamTabsContainer = document.getElementById('team-tabs-container');
    const tabelaPacientesBody = document.getElementById('tabela-pacientes-body');
    const paginationContainer = document.getElementById('pagination-container');
    const paginationInfo = document.getElementById('pagination-info');
    const scrollLeftBtn = document.getElementById('scroll-left-btn');
    const scrollRightBtn = document.getElementById('scroll-right-btn');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const searchInput = document.getElementById('search-input');
    const printInvitesBtn = document.getElementById('print-invites-btn');
    const printInvitesText = document.getElementById('print-invites-text');

    // --- Elementos do Menu de Filtro ---
    const filterMenuContainer = document.getElementById('filter-menu-container');
    const filterBtn = document.getElementById('filter-btn');
    const filterDropdown = document.getElementById('filter-dropdown');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    // --- Elementos do Menu de Exportação ---
    const exportMenuContainer = document.getElementById('export-menu-container');
    const exportBtn = document.getElementById('export-btn');
    const exportDropdown = document.getElementById('export-dropdown');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    // --- Elementos do Menu de Ordenação ---
    const sortMenuContainer = document.getElementById('sort-menu-container');
    const sortBtn = document.getElementById('sort-btn');
    const sortBtnText = document.getElementById('sort-btn-text');
    const sortDropdown = document.getElementById('sort-dropdown');

    // --- Variáveis de Estado ---
    let activeTeam = 'Todas';
    let currentPage = 1;
    let allPacientes = [];
    let currentSearchTerm = '';
    let activeFilters = {};
    let currentSort = 'nome_asc';

    const statusMap = {
        '0': { text: '', class: '' },
        '1': { text: 'Convite com o Agente', class: 'status-com-agente' },
        '2': { text: 'Convite entregue', class: 'status-entregue' },
        '3': { text: 'Compareceu à consulta', class: 'status-compareceu' },
        '4': { text: 'Não encontrado', class: 'status-nao-encontrado' }
    };

    function checkScrollButtons() {
        const container = teamTabsContainer.querySelector('.scrollbar-hide');
        if (container) {
            const { scrollWidth, clientWidth, scrollLeft } = container;
            scrollLeftBtn.classList.toggle('hidden', scrollLeft <= 0);
            scrollRightBtn.classList.toggle('hidden', scrollLeft >= scrollWidth - clientWidth - 1);
        }
    }

    function setupScrollButtons() {
        const container = teamTabsContainer.querySelector('.scrollbar-hide');
        if (container) {
            scrollLeftBtn.addEventListener('click', () => { container.scrollBy({ left: -200, behavior: 'smooth' }); });
            scrollRightBtn.addEventListener('click', () => { container.scrollBy({ left: 200, behavior: 'smooth' }); });
            container.addEventListener('scroll', checkScrollButtons);
            checkScrollButtons();
            setTimeout(checkScrollButtons, 500);
        }
    }

    function fetchEquipes() {
        fetch('/api/equipes')
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const equipes = data;
                    const tabsHtml = `
                        <div class="flex items-center space-x-1 overflow-x-auto pb-2 flex-grow scrollbar-hide" style="scroll-snap-type: x mandatory;">
                            <button class="team-tab px-4 py-2 text-sm font-medium whitespace-nowrap" data-equipe="Todas" style="scroll-snap-align: start;">Todas as Equipes</button>
                            ${equipes.map(equipe => `
                                <button class="team-tab px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap" data-equipe="${equipe}" style="scroll-snap-align: start;">${equipe}</button>
                            `).join('')}
                        </div>
                    `;
                    teamTabsContainer.innerHTML = tabsHtml;
                    setActiveTab('Todas');
                    document.querySelectorAll('.team-tab').forEach(tab => {
                        tab.addEventListener('click', () => {
                            activeTeam = tab.dataset.equipe;
                            currentPage = 1;
                            currentSearchTerm = '';
                            searchInput.value = '';
                            clearAllFilters();
                            fetchPacientes();
                            setActiveTab(activeTeam);
                        });
                    });
                    setupScrollButtons();
                } else {
                    console.error('Erro ao buscar equipes:', data.erro || 'Resposta inválida da API');
                }
            })
            .catch(error => console.error('Erro de rede ao buscar equipes:', error));
    }

    function setActiveTab(equipeName) {
        document.querySelectorAll('.team-tab').forEach(tab => {
            if (tab.dataset.equipe === equipeName) {
                tab.classList.add('text-primary', 'border-primary');
                tab.classList.remove('text-gray-500', 'border-transparent', 'hover:border-gray-300');
            } else {
                tab.classList.remove('text-primary', 'border-primary');
                tab.classList.add('text-gray-500', 'border-transparent', 'hover:border-gray-300');
            }
        });
        const teamText = equipeName === 'Todas' ? 'Todas as Equipes' : equipeName;
        if (printInvitesText) {
            printInvitesText.textContent = `Imprimir Convites - ${teamText}`;
        }
    }

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
        }
        return (diffDays <= limiteDias) ? 'em dia' : 'atrasado';
    }

    function getStatusContent(paciente, status) {
        if (paciente.gestante) {
            return `<div class="text-xs">Data Provável do Parto:</div><div>${paciente.data_provavel_parto || 'N/A'}</div>`;
        }
        if (status === 'na' || status === 'sem_metodo') return '';
        const dataFormatada = new Date(paciente.data_aplicacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        if (status === 'em dia') {
            return `<div>${dataFormatada}</div><span class="status-badge status-badge-ok mt-1">(em dia)</span>`;
        } else {
            return `<div>${dataFormatada}</div><span class="status-badge status-badge-late mt-1">(atrasado)</span>`;
        }
    }

    function getMetodoContent(paciente) {
        if (paciente.gestante) {
            return `<span class="status-badge status-badge-pregnant">GESTANTE</span>`;
        }
        if (!paciente.metodo) {
            return `<span class="status-badge status-badge-no-method">Nenhum método</span>`;
        }
        return `<span class="method-badge">${paciente.metodo}</span>`;
    }

    function getImprimirCellContent(paciente, status) {
        const isAtrasado = status === 'atrasado';
        const semMetodo = status === 'sem_metodo';
        if (!paciente.gestante && (semMetodo || isAtrasado)) {
            return `<input type="checkbox" class="print-checkbox h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" data-cns="${paciente.cartao_sus}">`;
        }
        return '';
    }

    function getAcompanhamentoCellContent(paciente, status) {
        const isAtrasado = status === 'atrasado';
        const semMetodo = status === 'sem_metodo';
        if (!paciente.gestante && (semMetodo || isAtrasado)) {
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
                            <a href="#" class="acompanhamento-option text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-action="1">Convite com o Agente</a>
                            <a href="#" class="acompanhamento-option text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-action="2">Convite Entregue</a>
                            <a href="#" class="acompanhamento-option text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-action="3">Compareceu na consulta</a>
                            <a href="#" class="acompanhamento-option text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" data-action="4">Não encontrado</a>
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

    function fetchPacientes() {
        tabelaPacientesBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">Carregando...</td></tr>`;

        const params = new URLSearchParams({
            equipe: activeTeam,
            page: currentPage,
            sort_by: currentSort
        });

        if (currentSearchTerm) {
            params.append('search', currentSearchTerm);
        }

        for (const key in activeFilters) {
            activeFilters[key].forEach(value => {
                params.append(key, value);
            });
        }

        fetch(`/api/pacientes_plafam?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (selectAllCheckbox) { selectAllCheckbox.checked = false; }
                tabelaPacientesBody.innerHTML = '';
                allPacientes = data.pacientes || [];

                if (allPacientes.length > 0) {
                    allPacientes.forEach(paciente => {
                        const row = document.createElement('tr');
                        row.classList.add('table-row', 'cursor-pointer');
                        const statusAcompanhamento = getAcompanhamentoStatus(paciente);
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
                            <td class="px-6 py-4 whitespace-nowrap">${paciente.idade_calculada} anos</td>
                            <td class="px-6 py-4 whitespace-nowrap">${getMetodoContent(paciente)}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${getStatusContent(paciente, statusAcompanhamento)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-center">${getAcompanhamentoCellContent(paciente, statusAcompanhamento)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-center">${getImprimirCellContent(paciente, statusAcompanhamento)}</td>
                        `;
                        tabelaPacientesBody.appendChild(row);
                    });
                } else {
                    tabelaPacientesBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500">Nenhum resultado encontrado.</td></tr>`;
                }
                renderPagination(data.total, data.page, data.limit, data.pages);
            })
            .catch(error => {
                console.error('Erro ao carregar pacientes:', error);
                tabelaPacientesBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-500">Erro ao carregar dados.</td></tr>`;
            });
    }

    function createPaginationLogic(currentPage, totalPages) {
        let pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
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
            pages.push(totalPages);
        }
        return pages;
    }

    function renderPagination(total, page, limit, totalPages) {
        if (!total || totalPages <= 1) {
            paginationInfo.innerHTML = '';
            paginationContainer.innerHTML = '';
            return;
        }
        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        paginationInfo.innerHTML = `Mostrando <span class="font-medium">${start}</span> a <span class="font-medium">${end}</span> de <span class="font-medium">${total}</span> resultados`;

        let paginationHtml = '';

        paginationHtml += `<button class="pagination-button ${page === 1 ? 'disabled' : ''}" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}"><i class="ri-arrow-left-s-line"></i></button>`;

        const pagesToShow = createPaginationLogic(page, totalPages);

        pagesToShow.forEach(p => {
            if (p === '...') {
                paginationHtml += `<span class="pagination-button disabled">...</span>`;
            } else {
                paginationHtml += `<button class="pagination-button ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
            }
        });

        paginationHtml += `<button class="pagination-button ${page === totalPages ? 'disabled' : ''}" ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}"><i class="ri-arrow-right-s-line"></i></button>`;

        paginationContainer.innerHTML = paginationHtml;

        document.querySelectorAll('.pagination-button').forEach(button => {
            if (button.dataset.page) {
                button.addEventListener('click', () => {
                    const newPage = parseInt(button.dataset.page);
                    if (newPage && newPage !== currentPage && !button.disabled) {
                        currentPage = newPage;
                        fetchPacientes();
                    }
                });
            }
        });
    }

    function generateInvitePDF(pacientesSelecionados) {
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
            const tituloConvite = statusAcompanhamento === 'atrasado' ? "Lembrete Importante" : "Planejamento Familiar - Convite";
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
            } else {
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

    function clearAllFilters() {
        document.querySelectorAll('#filter-dropdown input[type="checkbox"]').forEach(cb => cb.checked = false);
        activeFilters = {};
    }

    function exportData(format) {
        const params = new URLSearchParams({
            equipe: activeTeam,
            sort_by: currentSort
        });
        if (currentSearchTerm) {
            params.append('search', currentSearchTerm);
        }
        for (const key in activeFilters) {
            activeFilters[key].forEach(value => {
                params.append(key, value);
            });
        }
        fetch(`/api/export_data?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (data.erro || !Array.isArray(data) || data.length === 0) {
                    alert('Nenhum dado para exportar com os filtros atuais.');
                    return;
                }
                const dataToExport = data.map(p => ({
                    'Nome da Paciente': p.nome_paciente,
                    'CNS': p.cartao_sus,
                    'Idade': p.idade_calculada,
                    'Equipe': p.nome_equipe,
                    'Microárea': p.micro_area,
                    'Agente': p.nome_agente || 'A definir',
                    'Método Atual': p.metodo || 'Nenhum',
                    'Data Aplicação': p.data_aplicacao || '',
                    'Status Acompanhamento': getAcompanhamentoStatus(p),
                    'Gestante': p.gestante ? 'Sim' : 'Não',
                    'DPP': p.data_provavel_parto || '',
                }));
                if (format === 'xlsx') {
                    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, "Pacientes");
                    XLSX.writeFile(workbook, `Plafam_${activeTeam}.xlsx`);
                } else if (format === 'csv') {
                    const header = Object.keys(dataToExport[0]).join(';');
                    const rows = dataToExport.map(row => Object.values(row).map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(';'));
                    const csvContent = "data:text/csv;charset=utf-8," + "\uFEFF" + header + "\n" + rows.join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `Plafam_${activeTeam}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else if (format === 'pdf') {
                    exportPDF(dataToExport);
                }
            })
            .catch(error => {
                console.error('Erro ao exportar dados:', error);
                alert('Falha ao exportar os dados.');
            });
    }

    function exportPDF(dataToExport) {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text("Relatório de Pacientes - Planejamento Familiar", 14, 22);
        const headers = [['Nome da Paciente', 'CNS', 'Idade', 'Equipe', 'Agente', 'Microárea', 'Método Atual', 'Status']];
        const body = dataToExport.map(p => [
            p['Nome da Paciente'],
            p['CNS'],
            p['Idade'],
            p['Equipe'],
            p['Agente'],
            p['Microárea'],
            p['Método Atual'],
            p['Status Acompanhamento']
        ]);
        doc.autoTable({
            head: headers,
            body: body,
            startY: 30,
            theme: 'striped',
            headStyles: { fillColor: [29, 112, 184] },
        });
        doc.save(`Plafam_Relatorio_${activeTeam}.pdf`);
    }

    // --- Event Listeners ---

    tabelaPacientesBody.addEventListener('click', function (event) {
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

        const checkbox = row.querySelector('.print-checkbox');
        if (checkbox) {
            if (event.target.tagName !== 'INPUT') {
                checkbox.checked = !checkbox.checked;
            }
            checkbox.dispatchEvent(new Event('change'));
        }
    });

    tabelaPacientesBody.addEventListener('change', function (event) {
        if (event.target.classList.contains('print-checkbox')) {
            const row = event.target.closest('tr');
            row.classList.toggle('row-selected', event.target.checked);
        }
    });

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function (event) {
            const isChecked = event.target.checked;
            document.querySelectorAll('.print-checkbox').forEach(checkbox => {
                checkbox.checked = isChecked;
                checkbox.dispatchEvent(new Event('change'));
            });
        });
    }

    printInvitesBtn.addEventListener('click', () => {
        const selectedIds = [];
        document.querySelectorAll('.print-checkbox:checked').forEach(checkbox => {
            selectedIds.push(checkbox.dataset.cns);
        });
        if (selectedIds.length === 0) {
            alert("Por favor, selecione pelo menos um paciente para imprimir o convite.");
            return;
        }
        const pacientesParaImprimir = allPacientes.filter(p => selectedIds.includes(p.cartao_sus));
        if (pacientesParaImprimir.length > 0) {
            generateInvitePDF(pacientesParaImprimir);
        } else {
            console.error("Nenhum objeto paciente encontrado para os IDs selecionados.");
            alert("Ocorreu um erro ao encontrar os dados dos pacientes selecionados. Tente novamente.");
        }
    });

    searchInput.addEventListener('input', (event) => {
        let value = event.target.value;
        value = value.replace(/[^a-zA-Z0-9\s]/g, '');
        value = value.toUpperCase();
        event.target.value = value;
    });

    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            currentPage = 1;
            currentSearchTerm = event.target.value;
            fetchPacientes();
        }
    });

    filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exportDropdown.classList.add('hidden');
        sortDropdown.classList.add('hidden');
        filterDropdown.classList.toggle('hidden');
    });

    applyFiltersBtn.addEventListener('click', () => {
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
        fetchPacientes();
        filterDropdown.classList.add('hidden');
    });

    clearFiltersBtn.addEventListener('click', () => {
        clearAllFilters();
        currentPage = 1;
        fetchPacientes();
    });

    exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterDropdown.classList.add('hidden');
        sortDropdown.classList.add('hidden');
        exportDropdown.classList.toggle('hidden');
    });

    sortBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterDropdown.classList.add('hidden');
        exportDropdown.classList.add('hidden');
        sortDropdown.classList.toggle('hidden');
    });

    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            currentSort = e.currentTarget.dataset.sort;
            sortBtnText.textContent = e.currentTarget.dataset.text;
            currentPage = 1;
            fetchPacientes();
            sortDropdown.classList.add('hidden');
        });
    });

    exportExcelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        exportData('xlsx');
        exportDropdown.classList.add('hidden');
    });

    exportCsvBtn.addEventListener('click', (e) => {
        e.preventDefault();
        exportData('csv');
        exportDropdown.classList.add('hidden');
    });

    exportPdfBtn.addEventListener('click', (e) => {
        e.preventDefault();
        exportData('pdf');
        exportDropdown.classList.add('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!filterMenuContainer.contains(e.target)) {
            filterDropdown.classList.add('hidden');
        }
        if (!exportMenuContainer.contains(e.target)) {
            exportDropdown.classList.add('hidden');
        }
        if (!sortMenuContainer.contains(e.target)) {
            sortDropdown.classList.add('hidden');
        }
        if (!e.target.closest('.acompanhamento-btn')) {
            document.querySelectorAll('.acompanhamento-dropdown').forEach(m => m.classList.add('hidden'));
        }
    });

    // --- Inicialização ---
    fetchEquipes();
    fetchPacientes();
    sortBtnText.textContent = 'Nome (A-Z)';
});
