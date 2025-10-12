/**
 * MELHORIAS DO PAINEL DE DOMICÍLIOS
 *
 * Este arquivo contém melhorias adicionadas ao painel de domicílios:
 * 1. Seleção de TODOS os domicílios filtrados (não apenas da página atual)
 * 2. Organização do PDF por microárea
 * 3. Barra de progresso durante geração de PDF
 * 4. Validação para bloquear PDF quando "Todas as equipes" estiver selecionado
 */

// Aguardar carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('Melhorias do painel de domicílios carregadas');

    // Criar e adicionar barra de progresso ao DOM (inicialmente oculta)
    criarBarraProgresso();

    // Sobrescrever função gerarPdfLote com validações e melhorias
    const btnGerarPdfLote = document.getElementById('gerar-pdf-lote');
    if (btnGerarPdfLote) {
        // Remover event listener antigo (clonar e substituir elemento)
        const novoBtnGerarPdfLote = btnGerarPdfLote.cloneNode(true);
        btnGerarPdfLote.parentNode.replaceChild(novoBtnGerarPdfLote, btnGerarPdfLote);

        // Adicionar novo event listener com validação
        novoBtnGerarPdfLote.addEventListener('click', gerarPdfLoteComValidacao);
    }

    // Sobrescrever botão "Confirmar Gerar PDF" com nova lógica
    const btnConfirmarGerarPdf = document.getElementById('btn-confirmar-gerar-pdf');
    if (btnConfirmarGerarPdf) {
        const novoBtnConfirmarGerarPdf = btnConfirmarGerarPdf.cloneNode(true);
        btnConfirmarGerarPdf.parentNode.replaceChild(novoBtnConfirmarGerarPdf, btnConfirmarGerarPdf);

        novoBtnConfirmarGerarPdf.addEventListener('click', confirmarGerarPdfLoteMelhorado);
    }
});

/**
 * Cria a barra de progresso e adiciona ao DOM
 */
function criarBarraProgresso() {
    const barraHtml = `
        <!-- Modal de Progresso do PDF -->
        <div id="modal-progresso-pdf" class="fixed z-50 inset-0 overflow-y-auto hidden" aria-labelledby="modal-progresso-title" role="dialog" aria-modal="true">
            <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <!-- Background overlay -->
                <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                <!-- Center modal -->
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <!-- Conteúdo do modal -->
                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <!-- Header do modal -->
                    <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="ri-file-pdf-line text-white text-3xl"></i>
                            </div>
                            <div class="ml-4">
                                <h3 class="text-xl font-bold text-white">
                                    Gerando PDF
                                </h3>
                                <p class="text-sm text-blue-100 mt-1">
                                    Aguarde enquanto processamos os domicílios...
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Corpo do modal -->
                    <div class="bg-white px-6 py-6">
                        <!-- Barra de progresso -->
                        <div class="mb-4">
                            <div class="flex justify-between text-sm text-gray-600 mb-2">
                                <span id="progresso-status">Iniciando...</span>
                                <span id="progresso-percentual">0%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                <div id="progresso-barra" class="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-300 ease-out" style="width: 0%">
                                    <div class="h-full w-full opacity-25 bg-stripes"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Informações adicionais -->
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div class="flex items-start">
                                <i class="ri-information-line text-blue-600 text-xl mr-3 mt-0.5"></i>
                                <div class="flex-1">
                                    <p class="text-sm text-blue-800" id="progresso-info">
                                        Preparando documentos...
                                    </p>
                                    <p class="text-xs text-blue-600 mt-1" id="progresso-detalhe">
                                        Por favor, não feche esta janela
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Animação de loading -->
                        <div class="flex justify-center mt-6">
                            <div class="flex space-x-2">
                                <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                                <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                                <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .bg-stripes {
                background-image: linear-gradient(
                    45deg,
                    rgba(255, 255, 255, 0.2) 25%,
                    transparent 25%,
                    transparent 50%,
                    rgba(255, 255, 255, 0.2) 50%,
                    rgba(255, 255, 255, 0.2) 75%,
                    transparent 75%,
                    transparent
                );
                background-size: 1rem 1rem;
                animation: move 1s linear infinite;
            }

            @keyframes move {
                0% { background-position: 0 0; }
                100% { background-position: 1rem 1rem; }
            }
        </style>
    `;

    // Adicionar ao body
    document.body.insertAdjacentHTML('beforeend', barraHtml);
}

/**
 * Mostra a barra de progresso
 */
function mostrarBarraProgresso() {
    const modal = document.getElementById('modal-progresso-pdf');
    if (modal) {
        modal.classList.remove('hidden');
        atualizarProgresso(0, 'Iniciando...', 'Preparando documentos...');
    }
}

/**
 * Esconde a barra de progresso
 */
function esconderBarraProgresso() {
    const modal = document.getElementById('modal-progresso-pdf');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Atualiza a barra de progresso
 * @param {number} percentual - Percentual de progresso (0-100)
 * @param {string} status - Texto de status principal
 * @param {string} info - Informação adicional
 */
function atualizarProgresso(percentual, status, info = '') {
    const barra = document.getElementById('progresso-barra');
    const percentualText = document.getElementById('progresso-percentual');
    const statusText = document.getElementById('progresso-status');
    const infoText = document.getElementById('progresso-info');

    if (barra) barra.style.width = `${percentual}%`;
    if (percentualText) percentualText.textContent = `${Math.round(percentual)}%`;
    if (statusText) statusText.textContent = status;
    if (info && infoText) infoText.textContent = info;
}

/**
 * Função de validação antes de gerar PDF em lote
 */
function gerarPdfLoteComValidacao() {
    // Pegar elementos do DOM para checar filtros (acessar variável global do script principal se possível)
    const equipeButtonText = document.getElementById('domicilio-equipe-button-text');

    if (equipeButtonText && equipeButtonText.textContent === 'Todas as equipes') {
        alert('⚠️ Não é possível gerar PDF com "Todas as equipes" selecionado.\n\nPor favor, selecione uma equipe específica antes de gerar o PDF.');
        return;
    }

    // Verificar se há domicílios selecionados (usar função do módulo de seleção)
    const totalSelecionados = window.contarDomiciliosSelecionados ? window.contarDomiciliosSelecionados() : 0;

    if (totalSelecionados === 0) {
        alert('Selecione pelo menos um domicílio para gerar o PDF.');
        return;
    }

    // Atualizar quantidade no modal e abrir
    const pdfTotalSelecionados = document.getElementById('pdf-total-selecionados');
    if (pdfTotalSelecionados) {
        pdfTotalSelecionados.textContent = totalSelecionados;
    }

    // Abrir modal de opções
    const modalOpcoesPdf = document.getElementById('modal-opcoes-pdf');
    if (modalOpcoesPdf) {
        modalOpcoesPdf.classList.remove('hidden');
    }
}

/**
 * Função melhorada para confirmar geração de PDF em lote
 * Inclui:
 * - Barra de progresso
 * - Organização por microárea
 * - Busca de todos os domicílios filtrados (não apenas checkboxes marcados)
 */
async function confirmarGerarPdfLoteMelhorado() {
    try {
        // Fechar modal de opções
        const modalOpcoesPdf = document.getElementById('modal-opcoes-pdf');
        if (modalOpcoesPdf) {
            modalOpcoesPdf.classList.add('hidden');
        }

        // Obter IDs selecionados (usar função global do módulo de seleção)
        const idsSelecionados = window.obterIdsSelecionados ? window.obterIdsSelecionados() : [];

        if (idsSelecionados.length === 0) {
            alert('Nenhum domicílio selecionado.');
            return;
        }

        // Mostrar barra de progresso
        mostrarBarraProgresso();
        atualizarProgresso(5, 'Preparando...', `${idsSelecionados.length} domicílio(s) selecionado(s)`);

        // Obter equipe selecionada
        const equipeButtonText = document.getElementById('domicilio-equipe-button-text');
        const equipeSelecionada = equipeButtonText ? equipeButtonText.textContent : 'Equipe não especificada';

        atualizarProgresso(10, 'Buscando detalhes...', 'Carregando informações dos domicílios');

        // Buscar detalhes de cada domicílio selecionado
        const dadosCompletos = [];

        for (let i = 0; i < idsSelecionados.length; i++) {
            const idDomicilio = idsSelecionados[i];
            const percentual = 20 + (i / idsSelecionados.length) * 50; // 20% a 70%

            atualizarProgresso(
                percentual,
                `Carregando domicílio ${i + 1}/${idsSelecionados.length}`,
                `ID: ${idDomicilio}`
            );

            try {
                const resp = await fetch(`/api/domicilios/${idDomicilio}/familia`);
                const dadosDomicilio = await resp.json();

                if (dadosDomicilio.sucesso) {
                    dadosCompletos.push(dadosDomicilio);
                }
            } catch (err) {
                console.error(`Erro ao buscar domicílio ${idDomicilio}:`, err);
            }
        }

        atualizarProgresso(70, 'Organizando por microárea...', 'Preparando estrutura do PDF');

        // Organizar domicílios por microárea
        const domiciliosPorMicroarea = organizarPorMicroarea(dadosCompletos);

        atualizarProgresso(75, 'Gerando PDF...', 'Configurando documento');

        // Gerar PDF com domicílios organizados por microárea
        await gerarPdfOrganizadoPorMicroarea(domiciliosPorMicroarea, equipeSelecionada);

        atualizarProgresso(100, 'Concluído!', `PDF gerado com sucesso com ${dadosCompletos.length} domicílio(s)`);

        // Aguardar 1 segundo antes de fechar
        await new Promise(resolve => setTimeout(resolve, 1000));

        esconderBarraProgresso();
        alert(`✅ PDF gerado com sucesso!\n\nTotal de domicílios: ${dadosCompletos.length}`);

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        esconderBarraProgresso();
        alert(`❌ Erro ao gerar PDF: ${error.message}`);
    }
}

/**
 * Organiza domicílios por microárea
 * @param {Array} domicilios - Array de domicílios com dados completos
 * @returns {Object} Objeto com microáreas como chaves e arrays de domicílios como valores
 */
function organizarPorMicroarea(domicilios) {
    const porMicroarea = {};

    domicilios.forEach(dados => {
        const domicilio = dados.domicilio;
        const familias = dados.familias || [];

        // Determinar microárea predominante dos responsáveis familiares
        let microarea = 'Sem Microárea';

        for (const familia of familias) {
            for (const membro of familia.membros) {
                if (membro.eh_responsavel === 1 && membro.microarea) {
                    microarea = membro.microarea;
                    break;
                }
            }
            if (microarea !== 'Sem Microárea') break;
        }

        if (!porMicroarea[microarea]) {
            porMicroarea[microarea] = [];
        }

        porMicroarea[microarea].push(dados);
    });

    return porMicroarea;
}

/**
 * Gera PDF organizado por microárea
 * Cada microárea começa em uma nova página
 */
async function gerarPdfOrganizadoPorMicroarea(domiciliosPorMicroarea, equipeSelecionada) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4'); // 'p' = portrait (retrato)
    const pageWidth = 210;  // Largura em retrato
    const pageHeight = 297; // Altura em retrato
    const margin = 10;

    // Página de capa
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(29, 112, 184);
    doc.text('RELATÓRIO DE DOMICÍLIOS', pageWidth / 2, 70, { align: 'center' });

    doc.setFontSize(18);
    doc.text('Organizado por Microárea', pageWidth / 2, 85, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Sistema de Atenção Primária à Saúde', pageWidth / 2, 105, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const dataGeracao = new Date().toLocaleString('pt-BR');
    doc.text(`Data de Geração: ${dataGeracao}`, pageWidth / 2, 125, { align: 'center' });
    doc.text(`Equipe: ${equipeSelecionada}`, pageWidth / 2, 135, { align: 'center' });

    const totalDomicilios = Object.values(domiciliosPorMicroarea).reduce((sum, arr) => sum + arr.length, 0);
    doc.text(`Total de Domicílios: ${totalDomicilios}`, pageWidth / 2, 145, { align: 'center' });
    doc.text(`Microáreas: ${Object.keys(domiciliosPorMicroarea).length}`, pageWidth / 2, 155, { align: 'center' });

    // Ordenar microáreas alfabeticamente
    const microareasOrdenadas = Object.keys(domiciliosPorMicroarea).sort();

    // Processar cada microárea
    for (const microarea of microareasOrdenadas) {
        const domicilios = domiciliosPorMicroarea[microarea];

        // Nova página para cada microárea
        doc.addPage();
        let currentY = 20;

        // Cabeçalho da microárea
        doc.setFillColor(29, 112, 184);
        doc.rect(margin, currentY, pageWidth - (margin * 2), 15, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text(`${equipeSelecionada} - MICROÁREA: ${microarea}`, margin + 5, currentY + 10);

        doc.setFontSize(10);
        doc.text(`${domicilios.length} domicílio(s)`, pageWidth - margin - 40, currentY + 10);

        currentY += 20;

        // Processar cada domicílio da microárea
        for (let i = 0; i < domicilios.length; i++) {
            const dados = domicilios[i];
            const domicilioCompleto = dados.domicilio;
            const familias = dados.familias || [];

            // Verificar se precisa de nova página (ajustado para retrato)
            if (currentY > 250) {
                doc.addPage();
                currentY = 20;

                // Repetir cabeçalho da microárea
                doc.setFillColor(29, 112, 184);
                doc.rect(margin, currentY, pageWidth - (margin * 2), 12, 'F');
                doc.setFont("helvetica", "bold");
                doc.setFontSize(12);
                doc.setTextColor(255, 255, 255);
                doc.text(`${equipeSelecionada} - MICROÁREA: ${microarea} (continuação)`, margin + 5, currentY + 8);
                currentY += 17;
            }

            // Cabeçalho do domicílio
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(29, 112, 184);
            
            // Montar cabeçalho: NUMERO. DOMICÍLIO - ENDEREÇO, BAIRRO - CEP
            let cabecalhoDomicilio = `${i + 1}. DOMICÍLIO - ${domicilioCompleto.endereco_completo || 'Não informado'}`;
            if (domicilioCompleto.bairro) {
                cabecalhoDomicilio += `, ${domicilioCompleto.bairro}`;
            }
            if (domicilioCompleto.cep) {
                cabecalhoDomicilio += ` - CEP: ${domicilioCompleto.cep}`;
            }
            
            // Quebrar linha se muito longo
            const splitCabecalho = doc.splitTextToSize(cabecalhoDomicilio, pageWidth - (margin * 2));
            splitCabecalho.forEach((linha, idx) => {
                doc.text(linha, margin, currentY + (idx * 4));
            });
            currentY += (splitCabecalho.length * 4) + 3;

            // Determinar equipe e microárea predominante do domicílio (dos responsáveis)
            const equipesCount = {};
            const microareasCount = {};

            familias.forEach(fam => {
                fam.membros.forEach(m => {
                    if (m.eh_responsavel === 1) {
                        if (m.equipe) {
                            equipesCount[m.equipe] = (equipesCount[m.equipe] || 0) + 1;
                        }
                        if (m.microarea) {
                            microareasCount[m.microarea] = (microareasCount[m.microarea] || 0) + 1;
                        }
                    }
                });
            });

            const equipePredominante = Object.keys(equipesCount).reduce((a, b) =>
                equipesCount[a] > equipesCount[b] ? a : b, null);
            const microareaPredominante = Object.keys(microareasCount).reduce((a, b) =>
                microareasCount[a] > microareasCount[b] ? a : b, null);

            // Tabela de famílias
            familias.forEach((familia, famIndex) => {
                // Verificar espaço
                if (currentY > 260) {
                    doc.addPage();
                    currentY = 20;
                }

                const responsavel = familia.membros.find(m => m.eh_responsavel === 1);
                const nomeFamilia = responsavel ? responsavel.nome : (familia.membros[0]?.nome || 'Família sem nome');

                // Cabeçalho da família
                doc.setFillColor(70, 130, 180);
                doc.rect(margin, currentY, pageWidth - (margin * 2), 6, 'F');
                doc.setFont("helvetica", "bold");
                doc.setFontSize(8);
                doc.setTextColor(255, 255, 255);
                doc.text(`Família ${famIndex + 1}: ${nomeFamilia}`, margin + 2, currentY + 4);

                currentY += 8;

                // Tabela de membros
                const membrosData = familia.membros.map(membro => {
                    const sexoCompleto = (membro.sexo || '').toUpperCase();
                    let sexoAbreviado = '-';
                    if (sexoCompleto.includes('FEMININO') || sexoCompleto.includes('F')) {
                        sexoAbreviado = 'F';
                    } else if (sexoCompleto.includes('MASCULINO') || sexoCompleto.includes('M')) {
                        sexoAbreviado = 'M';
                    }

                    let cpfCns = '-';
                    if (membro.cpf) {
                        cpfCns = String(membro.cpf);
                    } else if (membro.cns) {
                        cpfCns = String(membro.cns);
                    }

                    return [
                        membro.nome || '-',
                        sexoAbreviado,
                        membro.idade || '0',
                        cpfCns,
                        membro.equipe || '-',
                        membro.microarea || '-',
                        '' // Observação
                    ];
                });

                doc.autoTable({
                    startY: currentY,
                    head: [['Nome', 'Sexo', 'Idade', 'CPF/CNS', 'Equipe', 'Microárea', 'Observação']],
                    body: membrosData,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [70, 130, 180],
                        textColor: 255,
                        fontSize: 6,
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    bodyStyles: {
                        fontSize: 5,
                        textColor: 50
                    },
                    columnStyles: {
                        0: { cellWidth: 50 },              // Nome
                        1: { cellWidth: 10, halign: 'center' },  // Sexo
                        2: { cellWidth: 12, halign: 'center' },  // Idade
                        3: { cellWidth: 30, halign: 'center' },  // CPF/CNS
                        4: { cellWidth: 28 },              // Equipe
                        5: { cellWidth: 18, halign: 'center' },  // Microárea
                        6: { cellWidth: 42 }               // Observação
                    },
                    margin: { left: margin, right: margin },
                    didParseCell: function(data) {
                        // Colorir linha de amarelo se equipe OU microárea forem diferentes
                        if (data.section === 'body') {
                            const membro = familia.membros[data.row.index];
                            const equipeDiferente = membro.equipe && equipePredominante && membro.equipe !== equipePredominante;
                            const microareaDiferente = membro.microarea && microareaPredominante && membro.microarea !== microareaPredominante;

                            if (equipeDiferente || microareaDiferente) {
                                data.cell.styles.fillColor = [255, 255, 153]; // Amarelo claro
                            }
                        }
                    }
                });

                currentY = doc.lastAutoTable.finalY + 3;
            });

            currentY += 4;
        }
    }

    // Rodapé em todas as páginas
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");

        const dataGeracaoRodape = new Date().toLocaleString('pt-BR');
        const rodapeY = pageHeight - 5;
        doc.text(`Gerado em: ${dataGeracaoRodape}`, margin, rodapeY);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, rodapeY);
    }

    // Salvar PDF
    const nomeArquivo = `relatorio_domicilios_por_microarea_${new Date().getTime()}.pdf`;
    doc.save(nomeArquivo);
}
