document.addEventListener('DOMContentLoaded', function () {
    const { jsPDF } = window.jspdf;

    const teamTabsContainer = document.getElementById('team-tabs-container');
    const tabelaPacientesBody = document.getElementById('tabela-pacientes-body');
    const paginationContainer = document.getElementById('pagination-container');
    const scrollLeftBtn = document.getElementById('scroll-left-btn');
    const scrollRightBtn = document.getElementById('scroll-right-btn');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');

    // --- Elementos da Barra de Ferramentas ---
    const searchInput = document.getElementById('search-input');
    const filterBtn = document.getElementById('filter-btn');
    const sortBtn = document.getElementById('sort-btn');
    const exportBtn = document.getElementById('export-btn');
    const printInvitesBtn = document.getElementById('print-invites-btn');
    const printInvitesText = document.getElementById('print-invites-text');

    let activeTeam = 'Todas';
    let currentPage = 1;
    let allPacientes = [];

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
                            fetchPacientes(activeTeam, currentPage);
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
        const teamText = equipeName === 'Todas' ? 'Todas' : equipeName;
        if (printInvitesText) {
            printInvitesText.textContent = `Imprimir Convites (${teamText})`;
        }
    }

    function getAcompanhamentoStatus(paciente) {
        if (paciente.gestante || !paciente.data_aplicacao) return 'na';
        const dataAplicacao = new Date(paciente.data_aplicacao);
        const hoje = new Date();
        const diffTime = hoje - dataAplicacao;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        let limiteDias = Infinity;
        const metodoLower = (paciente.metodo || '').toLowerCase();
        if (metodoLower.includes('pílula') || metodoLower.includes('aco') || metodoLower.includes('mensal')) {
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
        if (status === 'na') return '';
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
            return `<span class="status-badge status-badge-no-method">Nenhum método registrado</span>`;
        }
        return `<span class="method-badge">${paciente.metodo}</span>`;
    }

    function getImprimirCellContent(paciente, status) {
        const semMetodo = !paciente.metodo;
        const isAtrasado = status === 'atrasado';
        if (!paciente.gestante && (semMetodo || isAtrasado)) {
            return `<input type="checkbox" class="print-checkbox h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" data-cns="${paciente.cartao_sus}">`;
        }
        return '';
    }

    function fetchPacientes(equipe, page) {
        tabelaPacientesBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-gray-500">Carregando...</td></tr>`;

        fetch(`/api/pacientes_plafam?equipe=${equipe}&page=${page}`)
            .then(response => response.json())
            .then(data => {
                if (selectAllCheckbox) { selectAllCheckbox.checked = false; }
                tabelaPacientesBody.innerHTML = '';
                allPacientes = data.pacientes || [];

                if (allPacientes.length > 0) {
                    allPacientes.forEach(paciente => {
                        const row = document.createElement('tr');
                        row.classList.add('table-row');
                        const statusAcompanhamento = getAcompanhamentoStatus(paciente);
                        row.innerHTML = `
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div class="ml-4">
                                        <div class="text-sm font-medium text-gray-900">${paciente.nome_paciente || ''}</div>
                                        <div class="text-xs text-gray-500">Cartão SUS: ${paciente.cartao_sus || ''}</div>
                                        <div class="text-xs text-gray-500">micro-área: ${paciente.micro_area || ''}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-900">${paciente.idade_calculada !== null ? paciente.idade_calculada + ' anos' : ''}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                ${getMetodoContent(paciente)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ${getStatusContent(paciente, statusAcompanhamento)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap"></td>
                            <td class="px-6 py-4 whitespace-nowrap"></td>
                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                ${getImprimirCellContent(paciente, statusAcompanhamento)}
                            </td>
                        `;
                        tabelaPacientesBody.appendChild(row);
                    });
                } else {
                    tabelaPacientesBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-gray-500">Nenhum paciente encontrado.</td></tr>`;
                }
                renderPagination(data.total, data.page, data.limit, data.pages);
            })
            .catch(error => {
                console.error('Erro ao carregar pacientes:', error);
                tabelaPacientesBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-red-500">Erro ao carregar dados.</td></tr>`;
            });
    }

    function createPaginationLogic(currentPage, totalPages) {
        let pages = [];
        const maxPagesToShow = 5;
        const halfPages = Math.floor(maxPagesToShow / 2);
        if (totalPages <= maxPagesToShow + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            let startPage = Math.max(2, currentPage - halfPages);
            let endPage = Math.min(totalPages - 1, currentPage + halfPages);
            if (currentPage - halfPages <= 2) {
                endPage = maxPagesToShow;
            }
            if (currentPage + halfPages >= totalPages - 1) {
                startPage = totalPages - maxPagesToShow + 1;
            }
            if (startPage > 2) {
                pages.push('...');
            }
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
            if (endPage < totalPages - 1) {
                pages.push('...');
            }
            pages.push(totalPages);
        }
        return pages;
    }

    function renderPagination(total, page, limit, pages) {
        if (!total || pages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        let paginationHtml = `
            <div class="text-sm text-gray-700">
                Mostrando <span class="font-medium">${start}</span> a <span class="font-medium">${end}</span> de <span class="font-medium">${total}</span> resultados
            </div>
            <div class="flex items-center space-x-1">
        `;
        paginationHtml += `<button class="pagination-button ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}"><i class="ri-arrow-left-s-line"></i></button>`;
        const pagesToShow = createPaginationLogic(page, pages);
        pagesToShow.forEach(p => {
            if (p === '...') {
                paginationHtml += `<span class="pagination-button">...</span>`;
            } else {
                paginationHtml += `<button class="pagination-button ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
            }
        });
        paginationHtml += `<button class="pagination-button ${page === pages ? 'opacity-50 cursor-not-allowed' : ''}" ${page === pages ? 'disabled' : ''} data-page="${page + 1}"><i class="ri-arrow-right-s-line"></i></button>`;
        paginationHtml += '</div>';
        paginationContainer.innerHTML = paginationHtml;
        document.querySelectorAll('.pagination-button').forEach(button => {
            if (button.dataset.page) {
                button.addEventListener('click', () => {
                    const newPage = parseInt(button.dataset.page);
                    if (newPage && newPage !== currentPage && !button.disabled) {
                        currentPage = newPage;
                        fetchPacientes(activeTeam, currentPage);
                    }
                });
            }
        });
    }

    /**
     * Gera o PDF com os convites dos pacientes selecionados.
     */
    function generatePDF(pacientesSelecionados) {
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
            doc.text(`${paciente.nome_equipe || 'Equipe não informada'} - ACS: Nome do Agente`, xStart + conviteWidth / 2, currentY, { align: 'center' });

            currentY += 5;
            doc.setDrawColor(220, 220, 220);
            doc.line(xStart + 5, currentY, xStart + conviteWidth - 5, currentY);

            currentY += 8;
            doc.setFontSize(10);
            doc.setTextColor('#333333');

            // --- CONTEÚDO CONDICIONAL DO CONVITE ---
            if (statusAcompanhamento === 'atrasado') {
                // --- MODELO DE CONVITE PARA MÉTODO ATRASADO ---
                doc.setFont("helvetica", "normal");
                let textoAtrasado = "Esperamos que esteja bem. ";
                doc.text(textoAtrasado, xStart + 10, currentY);

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
                // --- MODELO DE CONVITE PADRÃO (SEM MÉTODO) ---
                const textoConvite = "É com grande satisfação que convidamos você a participar do nosso programa de Planejamento Familiar na Unidade Básica de Saúde (UBS). Nosso objetivo é fornecer informações essenciais sobre métodos que possa evitar uma gravidez não planejada e promover a saúde reprodutiva das mulheres em nossa comunidade.";
                const splitTexto = doc.splitTextToSize(textoConvite, conviteWidth - 20);
                doc.text(splitTexto, xStart + 10, currentY);
                currentY += (splitTexto.length * 4.5) + 8; // Mais espaço antes da lista

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

            // --- RODAPÉ COMUM ---
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

    // --- Event Listeners ---

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
                const row = checkbox.closest('tr');
                row.classList.toggle('row-selected', isChecked);
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

        generatePDF(pacientesParaImprimir);
    });

    fetchEquipes();
    fetchPacientes(activeTeam, currentPage);

    window.addEventListener('resize', checkScrollButtons);
});
