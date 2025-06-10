console.log("Script JavaScript carregado e pronto para buscar dados!");

document.addEventListener('DOMContentLoaded', function() {
    // --- Lógica de Carregamento da Tabela de Pacientes (Dados do PostgreSQL) ---
    const tabelaPacientesBody = document.getElementById('tabela-pacientes-body');
    // Este span mostra a contagem de pacientes, ajuste o seletor se for diferente
    const pacientesTotaisSpan = document.querySelector('.flex.items-center.justify-between.mt-4.pt-4.border-t.border-gray-100 .text-gray-500 .font-medium:last-child');
    
    // Exibe mensagem de carregamento inicial na tabela
    if (tabelaPacientesBody) {
        tabelaPacientesBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">Carregando pacientes...</td></tr>';
    }

    fetch('/api/pacientes_plafam') // Faz uma requisição para a rota da API do Flask
        .then(response => {
            if (!response.ok) {
                // Lança um erro se a resposta HTTP não for bem-sucedida (ex: 404, 500)
                throw new Error('Erro ao carregar dados da API: ' + response.statusText);
            }
            return response.json(); // Converte a resposta para JSON
        })
        .then(data => {
            console.log('Dados recebidos do PostgreSQL:', data);

            if (data.length === 0) {
                // Mensagem se não houver dados, colspan="7" para cobrir todas as colunas
                tabelaPacientesBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">Nenhum paciente encontrado para os critérios especificados.</td></tr>';
            } else {
                tabelaPacientesBody.innerHTML = ''; // Limpa a mensagem de carregamento
                data.forEach(paciente => {
                    const row = document.createElement('tr');
                    row.classList.add('table-row'); // Adiciona classe para o efeito hover na linha
                    
                    // Gera as iniciais do nome para o avatar circular
                    const iniciais = paciente.nome_paciente ? paciente.nome_paciente.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '';
                    // Cores fixas para o avatar, você pode torná-las dinâmicas se quiser
                    const avatarBgColor = 'bg-purple-100'; 
                    const avatarTextColor = 'text-purple-500'; 

                    row.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="w-10 h-10 rounded-full ${avatarBgColor} flex items-center justify-center ${avatarTextColor} font-medium">
                                    ${iniciais}
                                </div>
                                <div class="ml-4">
                                    <div class="text-sm font-medium text-gray-900">${paciente.nome_paciente || 'N/A'}</div>
                                    <div class="text-xs text-gray-500">Cartão SUS: ${paciente.cartao_sus || 'N/A'}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${paciente.idade_calculada !== undefined ? paciente.idade_calculada + ' anos' : 'N/A'}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="method-badge ${getClassForMetodo(paciente.metodo_atual || '')}">${paciente.metodo_atual || 'N/A'}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${paciente.data_aplicacao || 'N/A'}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs rounded-full ${getClassForStatus(paciente.status_acompanhamento || '')}">${paciente.status_acompanhamento || 'N/A'}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${paciente.data_convite || 'N/A'}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs rounded-full ${getClassForConvite(paciente.status_convite || '')}">${paciente.status_convite || 'N/A'}</span>
                        </td>
                    `;
                    tabelaPacientesBody.appendChild(row);
                });
            }
            // Atualiza a contagem total de pacientes exibida na paginação
            if (pacientesTotaisSpan) {
                pacientesTotaisSpan.textContent = data.length; 
            }

        })
        .catch(error => {
            console.error('Erro ao carregar pacientes:', error);
            const tableContainer = document.querySelector('.bg-white.rounded.shadow-sm.overflow-hidden.mb-6');
            if (tableContainer) {
                tableContainer.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">Erro ao carregar os pacientes: ${error.message}. Verifique o console do navegador para mais detalhes.</div>`;
            }
        });

    // --- Funções Auxiliares para Classes de Estilo Dinâmicas ---
    function getClassForMetodo(metodo) {
        if (!metodo) return '';
        const metodoLower = metodo.toLowerCase();
        if (metodoLower.includes('pílula')) return 'pill';
        if (metodoLower.includes('diu')) return 'diu';
        if (metodoLower.includes('preservativo')) return 'preservativo';
        if (metodoLower.includes('injetável')) return 'injetavel';
        if (metodoLower.includes('implante')) return 'implante';
        if (metodoLower.includes('laqueadura')) return 'laqueadura';
        if (metodoLower.includes('vasectomia')) return 'vasectomia';
        return '';
    }

    function getClassForStatus(status) {
        if (!status) return 'bg-gray-100 text-gray-800';
        const statusLower = status.toLowerCase();
        if (statusLower.includes('em dia')) return 'bg-green-100 text-green-800';
        if (statusLower.includes('pendente') || statusLower.includes('atrasada')) return 'bg-red-100 text-red-800';
        if (statusLower.includes('breve') || statusLower.includes('troca')) return 'bg-yellow-100 text-yellow-800';
        return 'bg-gray-100 text-gray-800';
    }

    function getClassForConvite(statusConvite) {
        if (!statusConvite) return 'bg-gray-100 text-gray-800';
        const statusLower = statusConvite.toLowerCase();
        if (statusLower.includes('convidado')) return 'bg-blue-100 text-blue-800';
        if (statusLower.includes('confirmado')) return 'bg-green-100 text-green-800';
        if (statusLower.includes('pendente')) return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
    }

    // --- Lógica para o Dropdown de Filtros ---
    const filterButton = document.getElementById('filterButton');
    const filterDropdown = document.getElementById('filterDropdown');
    let isFilterOpen = false;

    if (filterButton && filterDropdown) {
        filterButton.addEventListener('click', function() {
            isFilterOpen = !isFilterOpen;
            if (isFilterOpen) {
                filterDropdown.style.display = 'block';
            } else {
                filterDropdown.style.display = 'none';
            }
        });
        
        document.addEventListener('click', function(event) {
            if (!filterButton.contains(event.target) && !filterDropdown.contains(event.target)) {
                filterDropdown.style.display = 'none';
                isFilterOpen = false;
            }
        });
    }

    // --- Lógica para Modais de Impressão e Convites ---
    const printInvitesButton = document.getElementById('printInvitesButton');
    const printInvitesModal = document.getElementById('printInvitesModal');
    const cancelPrintButton = document.getElementById('cancelPrintButton');
    const confirmPrintButton = document.getElementById('confirmPrintButton');
    const previewInvitesButton = document.getElementById('previewInvitesButton');
    const modalTitle = document.getElementById('modalTitle');
    const previewInvitesModal = document.getElementById('previewInvitesModal');
    const closePreviewButton = document.getElementById('closePreviewButton');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const currentPageSpan = document.getElementById('currentPage');
    const totalPagesSpan = document.getElementById('totalPages');
    let currentPage = 1;
    const invitesPerPage = 3;

    const mockPatients = [
        { name: 'Ana Silva Oliveira', cns: '123.4567.8901.2345', team: 'PSF 1', acs: 'Maria Santos' },
        { name: 'Juliana Rodrigues Almeida', cns: '765.4321.8901.2345', team: 'PSF 1', acs: 'Maria Santos' },
        { name: 'Carla Mendes Santos', cns: '234.5678.9012.3456', team: 'PSF 1', acs: 'Maria Santos' },
        { name: 'Beatriz Santos Costa', cns: '567.8901.2345.6789', team: 'PSF 1', acs: 'Maria Santos' },
        { name: 'Laura Moreira Pinto', cns: '123.4567.8901.2345', team: 'PSF 1', acs: 'Maria Santos' },
        { name: 'Isabella Fernandes Cardoso', cns: '890.1234.5678.9012', team: 'PSF 1', acs: 'Maria Santos' },
        { name: 'Gabriela Barbosa Santos', cns: '901.2345.6789.0123', team: 'PSF 1', acs: 'Maria Santos' },
        { name: 'Carolina Campos Oliveira', cns: '345.6789.0123.4567', team: 'PSF 1', acs: 'Maria Santos' },
        { name: 'Amanda Mendes Barros', cns: '789.0123.4567.8901', team: 'PSF 1', acs: 'Maria Santos' },
        { name: 'Thais Lima Carvalho', cns: '901.2345.6789.0123', team: 'PSF 1', acs: 'Maria Santos' },
        { name: 'Mariana Castro Oliveira', cns: '789.0123.4567.8901', team: 'PSF 1', acs: 'Maria Santos' },
        { name: 'Luciana Souza Ribeiro', cns: '678.9012.3456.7890', team: 'PSF 1', acs: 'Maria Santos' }
    ];

    function generateInviteTemplate(patient) {
        return `
        <div class="border border-gray-200 rounded-lg p-6 flex flex-col">
            <div class="text-center mb-6">
                <h3 class="text-xl font-semibold text-primary mb-1">Planejamento Familiar - Convite</h3>
                <p class="text-lg font-medium text-gray-900">${patient.name}</p>
                <p class="text-xs text-gray-500 mb-2">CNS: ${patient.cns}</p>
                <p class="text-sm text-gray-700">${patient.team} - ACS: ${patient.acs}</p>
            </div>
            <div class="text-center mb-6">
                <p class="text-gray-700">Convidamos você para conhecer os métodos contraceptivos disponíveis em nossa unidade de saúde. Venha conversar conosco sobre as opções que melhor se adequam às suas necessidades.</p>
            </div>
            <div class="space-y-4">
                <div class="flex items-start space-x-3">
                    <i class="ri-capsule-line text-primary mt-1"></i>
                    <div>
                        <span class="font-medium">DIU de Cobre</span>
                        <p class="text-sm text-gray-600">Um método SEM HORMÔNIO de longa duração (10 anos) - inserido na UBS em poucos minutos.</p>
                    </div>
                </div>
                <div class="flex items-start space-x-3">
                    <i class="ri-syringe-line text-primary mt-1"></i>
                    <div>
                        <span class="font-medium">Injetáveis</span>
                        <p class="text-sm text-gray-600">Que previnem a gravidez por um período específico: Mensal ou Trimestral.</p>
                    </div>
                </div>
                <div class="flex items-start space-x-3">
                    <i class="ri-medicine-bottle-line text-primary mt-1"></i>
                    <div>
                        <span class="font-medium">Pílulas Anticoncepcionais</span>
                        <p class="text-sm text-gray-600">Comprimidos diários que regulam o ciclo menstrual e previnem a gravidez.</p>
                    </div>
                </div>
                <div class="flex items-start space-x-3">
                    <i class="ri-heart-pulse-line text-primary mt-1"></i>
                    <div>
                        <span class="font-medium">Laqueadura ou Vasectomia</span>
                        <p class="text-sm text-gray-600">Método definitivo para acima de 21 anos, com ou sem filhos. Está sendo realizada no Hospital todo mês.</p>
                    </div>
                </div>
            </div>
            <div class="text-center mt-6">
                <p class="text-sm text-primary font-medium">Venha para sua consulta no seu posto. Não precisa tirar ficha antes.</p>
            </div>
        </div>
        `;
    }

    function updateInvitesPage(page) {
        const container = document.getElementById('invitesContainer');
        const startIndex = (page - 1) * invitesPerPage;
        const endIndex = startIndex + invitesPerPage;
        const pagePatients = mockPatients.slice(startIndex, endIndex);
        if (container) { 
             container.innerHTML = pagePatients.map(patient => generateInviteTemplate(patient)).join('');
        }
        if (currentPageSpan) currentPageSpan.textContent = page;
        const totalPagesCalculated = Math.ceil(mockPatients.length / invitesPerPage);
        if (totalPagesSpan) totalPagesSpan.textContent = totalPagesCalculated;
        if (prevPageBtn) prevPageBtn.disabled = page === 1;
        if (nextPageBtn) nextPageBtn.disabled = page === totalPagesCalculated;
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                updateInvitesPage(currentPage);
            }
        });
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(mockPatients.length / invitesPerPage); 
            if (currentPage < totalPages) {
                currentPage++;
                updateInvitesPage(currentPage);
            }
        });
    }

    if (printInvitesButton && printInvitesModal) {
        printInvitesButton.addEventListener('click', function() {
            const teamNameMatch = this.textContent.match(/\((.*?)\)/);
            const teamName = teamNameMatch ? teamNameMatch[1] : 'Todas as Equipes';
            if (modalTitle) modalTitle.textContent = `Imprimir Convites da Semana - ${teamName}`;
            printInvitesModal.classList.remove('hidden'); 
        });
    }
    if (cancelPrintButton && printInvitesModal) {
        cancelPrintButton.addEventListener('click', function() {
            printInvitesModal.classList.add('hidden'); 
        });
    }
    if (closePreviewButton && previewInvitesModal && printInvitesModal) {
        closePreviewButton.addEventListener('click', function() {
            previewInvitesModal.classList.add('hidden'); 
            printInvitesModal.classList.remove('hidden'); 
        });
    }
    if (previewInvitesButton && printInvitesModal && previewInvitesModal) {
        previewInvitesButton.addEventListener('click', function() {
            printInvitesModal.classList.add('hidden'); 
            previewInvitesModal.classList.remove('hidden');
            currentPage = 1;
            updateInvitesPage(currentPage); 
        });
    }

    if (confirmPrintButton) {
        confirmPrintButton.addEventListener('click', function() {
            const periodRadio = document.querySelector('input[name="period"]:checked');
            const formatRadio = document.querySelector('input[name="format"]:checked');
            const period = periodRadio ? periodRadio.value : 'week';
            const format = formatRadio ? formatRadio.value : 'standard';

            if (printInvitesModal) printInvitesModal.classList.add('hidden'); 

            const toastContainer = document.getElementById('toastContainer');
            if (!toastContainer) { 
                const newToastContainer = document.createElement('div');
                newToastContainer.id = 'toastContainer';
                newToastContainer.className = 'fixed bottom-4 right-4 z-50';
                document.body.appendChild(newToastContainer);
            }

            const loadingToast = document.createElement('div');
            loadingToast.className = 'bg-white shadow-lg rounded-lg p-4 mb-4 flex items-center space-x-3 animate-fade-in';
            loadingToast.innerHTML = `
                <div class="w-6 h-6 flex items-center justify-center">
                    <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div class="text-gray-700">Gerando PDF, aguarde...</div>
            `;
            document.getElementById('toastContainer').appendChild(loadingToast);

            setTimeout(() => {
                loadingToast.remove();
                
                const successToast = document.createElement('div');
                successToast.className = 'bg-white shadow-lg rounded-lg p-4 mb-4 flex items-center justify-between animate-fade-in';
                successToast.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <div class="w-6 h-6 flex items-center justify-center text-green-500">
                            <i class="ri-checkbox-circle-line text-xl"></i>
                        </div>
                        <div>
                            <div class="text-gray-700">PDF gerado com sucesso!</div>
                            <a href="#" class="text-primary text-sm hover:underline" id="openPdfLink">Abrir arquivo</a>
                        </div>
                    </div>
                    <button class="text-gray-400 hover:text-gray-600" onclick="this.parentElement.remove()">
                        <i class="ri-close-line"></i>
                    </button>
                `;
                document.getElementById('toastContainer').appendChild(successToast);

                setTimeout(() => {
                    successToast.remove();
                }, 5000);

                const mockPdfContent = "Conteúdo de exemplo do PDF."; 
                const blob = new Blob([mockPdfContent], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `convites-planejamento-familiar-${period}-${format}.pdf`;
                document.body.appendChild(link);
                link.click(); 
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url); 
                
                document.getElementById('openPdfLink').addEventListener('click', (e) => {
                    e.preventDefault(); 
                    window.open(url, '_blank'); 
                });
            }, 1500); 
        });
    }

    const style = document.createElement('style');
    style.textContent = `
    @keyframes fade-in {
        from { opacity: 0; transform: translateY(1rem); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
        animation: fade-in 0.3s ease-out forwards;
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .animate-spin {
        animation: spin 1s linear infinite;
    }
    `;
    document.head.appendChild(style);

    const tableRows = document.querySelectorAll('.table-row');
    tableRows.forEach(row => {
        row.addEventListener('click', function(e) {
            if (e.target.closest('button') || e.target.closest('i')) {
                return;
            }
            console.log('Abrir detalhes do paciente da tabela');
        });
    });

    const checkboxes = document.querySelectorAll('.custom-checkbox input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            console.log('Checkbox de filtro alterado:', this.value, this.checked);
        });
    });

    const teamTabs = document.querySelectorAll('button[class*="px-4 py-2 text-sm font-medium"]');
    teamTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            teamTabs.forEach(t => {
                t.classList.remove('text-primary', 'border-primary');
                t.classList.add('text-gray-500', 'border-transparent', 'hover:text-gray-700', 'hover:border-gray-300');
            });
            this.classList.remove('text-gray-500', 'border-transparent', 'hover:text-gray-700', 'hover:border-gray-300');
            this.classList.add('text-primary', 'border-primary');

            const teamName = this.textContent.trim();
            if (printInvitesButton) {
                printInvitesButton.innerHTML = `<i class="ri-printer-line mr-2"></i>Imprimir Convites da Semana (${teamName})`;
            }
            console.log('Filtrar por equipe:', teamName);
        });
    });

    const settingsButton = document.querySelector('.ri-settings-4-line'); 
    if (settingsButton) {
        settingsButton.parentElement.addEventListener('click', function() { 
            console.log('Abrir configurações de equipes');
        });
    }

}); // Fim do DOMContentLoaded