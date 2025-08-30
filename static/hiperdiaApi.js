// hiperdiaApi.js
// Este módulo encapsula todas as chamadas à API relacionadas ao painel Hiperdia.

const API_BASE_URL = ''; // Pode ser '/api' se todas as rotas começarem com /api

export const hiperdiaApi = {
    /**
     * Busca a lista de pacientes hipertensos com base nos filtros e paginação.
     * @param {object} params - Parâmetros de filtro e paginação (equipe, microarea, page, search, sort_by, status_filter).
     * @returns {Promise<object>} Dados dos pacientes e informações de paginação.
     */
    fetchPacientesHiperdia: async (params) => {
        const urlParams = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/api/pacientes_hiperdia_has?${urlParams}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    /**
     * Busca o total de hipertensos com base nos filtros.
     * @param {object} params - Parâmetros de filtro (equipe, microarea).
     * @returns {Promise<object>} Objeto com o total de pacientes.
     */
    fetchTotalHipertensos: async (params) => {
        const urlParams = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/api/get_total_hipertensos?${urlParams}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    /**
     * Busca o total de hipertensos com MRPA pendente com base nos filtros.
     * @param {object} params - Parâmetros de filtro (equipe, microarea).
     * @returns {Promise<object>} Objeto com o total de pacientes com MRPA pendente.
     */
    fetchHipertensosMRPAPendente: async (params) => {
        const urlParams = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/api/get_hipertensos_mrpa_pendente?${urlParams}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    /**
     * Busca a lista de equipes e microáreas para os filtros.
     * @returns {Promise<Array<object>>} Lista de equipes com microáreas e agentes.
     */
    fetchEquipesMicroareasHiperdia: async () => {
        const response = await fetch(`${API_BASE_URL}/api/equipes_microareas_hiperdia`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    /**
     * Busca os eventos da linha do tempo de um paciente.
     * @param {number} codCidadao - Código do cidadão.
     * @returns {Promise<Array<object>>} Lista de eventos da linha do tempo.
     */
    fetchTimelineEvents: async (codCidadao, periodFilter = 'all') => {
        const response = await fetch(`${API_BASE_URL}/api/hiperdia/timeline/${codCidadao}?period=${periodFilter}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    /**
     * Cancela uma ação pendente na linha do tempo.
     * @param {number} codAcompanhamento - Código do acompanhamento a ser cancelado.
     * @returns {Promise<object>} Objeto com status de sucesso/erro.
     */
    cancelarAcao: async (codAcompanhamento) => {
        const response = await fetch(`${API_BASE_URL}/api/hiperdia/cancelar_acao/${codAcompanhamento}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    /**
     * Registra uma nova ação para um paciente.
     * @param {object} payload - Dados da ação a ser registrada.
     * @returns {Promise<object>} Objeto com status de sucesso/erro.
     */
    registrarAcao: async (payload) => {
        console.log('[LOG] hiperdiaApi.registrarAcao - Iniciando');
        console.log('[LOG] Payload recebido:', payload);
        console.log('[LOG] URL da requisição:', `${API_BASE_URL}/api/hiperdia/registrar_acao`);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/hiperdia/registrar_acao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            console.log('[LOG] Status da resposta:', response.status);
            console.log('[LOG] OK da resposta:', response.ok);
            
            if (!response.ok) {
                console.log('[LOG] Erro na resposta HTTP:', response.status);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('[LOG] Resultado da API:', result);
            return result;
        } catch (error) {
            console.log('[LOG] Erro capturado em registrarAcao:', error);
            throw error;
        }
    },

    fetchMedicamentos: async (codCidadao) => {
        const response = await fetch(`${API_BASE_URL}/api/hiperdia/medicamentos/${codCidadao}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    /**
     * Busca uma ação pendente de um tipo específico para um paciente.
     * @param {number} codCidadao - Código do cidadão.
     * @param {number} codAcao - Código do tipo de ação (ex: 3 para Modificar tratamento).
     * @returns {Promise<object|null>} A ação pendente encontrada ou null.
     */
    fetchPendingActionByType: async (codCidadao, codAcao) => {
        const response = await fetch(`${API_BASE_URL}/api/hiperdia/pending_action/${codCidadao}/${codAcao}`);
        if (!response.ok) {
            if (response.status === 404) { // Not Found, meaning no pending action
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    /**
     * Busca uma ação pendente de um tipo específico para um paciente, retornando a mais recente.
     * @param {number} codCidadao - Código do cidadão.
     * @param {number} codAcao - Código do tipo de ação (ex: 9 para Agendar Hiperdia).
     * @returns {Promise<object|null>} A ação pendente mais recente encontrada ou null.
     */
    fetchLatestPendingActionByType: async (codCidadao, codAcao) => {
        const response = await fetch(`${API_BASE_URL}/api/hiperdia/latest_pending_action/${codCidadao}/${codAcao}`);
        if (!response.ok) {
            if (response.status === 404) { // Not Found, meaning no pending action
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    /**
     * Atualiza uma ação existente.
     * @param {number} codAcompanhamento - Código do acompanhamento a ser atualizado.
     * @param {object} payload - Dados da ação a serem atualizados.
     * @returns {Promise<object>} Objeto com status de sucesso/erro.
     */
    updateAcao: async (codAcompanhamento, payload) => {
        const response = await fetch(`${API_BASE_URL}/api/hiperdia/update_acao/${codAcompanhamento}`, {
            method: 'PUT', // Usar PUT para atualização
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    /**
     * Busca todos os medicamentos atuais de um paciente.
     * @param {number} codCidadao - Código do cidadão.
     * @returns {Promise<Array<object>>} Lista de medicamentos atuais.
     */
    fetchMedicamentosAtuais: async (codCidadao) => {
        try {
            if (!codCidadao) {
                throw new Error('Código do cidadão é obrigatório');
            }
            const response = await fetch(`${API_BASE_URL}/api/hiperdia/medicamentos_atuais/${codCidadao}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error('Erro ao buscar medicamentos atuais:', error);
            throw error;
        }
    },

    /**
     * Adiciona um novo medicamento para um paciente.
     * @param {object} medicamentoData - Dados do medicamento.
     * @returns {Promise<object>} Resultado da operação.
     */
    adicionarMedicamento: async (medicamentoData) => {
        try {
            if (!medicamentoData.codcidadao || !medicamentoData.nome_medicamento) {
                throw new Error('Código do cidadão e nome do medicamento são obrigatórios');
            }
            const response = await fetch(`${API_BASE_URL}/api/hiperdia/medicamentos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(medicamentoData),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error('Erro ao adicionar medicamento:', error);
            throw error;
        }
    },

    /**
     * Atualiza um medicamento existente.
     * @param {number} codSeqMedicamento - Código do medicamento.
     * @param {object} medicamentoData - Novos dados do medicamento.
     * @returns {Promise<object>} Resultado da operação.
     */
    atualizarMedicamento: async (codSeqMedicamento, medicamentoData) => {
        try {
            if (!codSeqMedicamento) {
                throw new Error('Código do medicamento é obrigatório');
            }
            const response = await fetch(`${API_BASE_URL}/api/hiperdia/medicamentos/${codSeqMedicamento}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(medicamentoData),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error('Erro ao atualizar medicamento:', error);
            throw error;
        }
    },

    /**
     * Remove/interrompe um medicamento.
     * @param {number} codSeqMedicamento - Código do medicamento.
     * @param {string} motivo - Motivo da interrupção.
     * @returns {Promise<object>} Resultado da operação.
     */
    interromperMedicamento: async (codSeqMedicamento, motivo) => {
        try {
            if (!codSeqMedicamento) {
                throw new Error('Código do medicamento é obrigatório');
            }
            const response = await fetch(`${API_BASE_URL}/api/hiperdia/medicamentos/${codSeqMedicamento}/interromper`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motivo, data_fim: new Date().toISOString().split('T')[0] }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error('Erro ao interromper medicamento:', error);
            throw error;
        }
    },

    /**
     * Busca lista de medicamentos anti-hipertensivos disponíveis.
     * @returns {Promise<Array<object>>} Lista de medicamentos anti-hipertensivos.
     */
    fetchMedicamentosHipertensao: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/hiperdia/medicamentos_hipertensao`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error('Erro ao buscar medicamentos para hipertensão:', error);
            throw error;
        }
    },

    /**
     * Atualiza o status de uma ação (REALIZADA ou CANCELADA).
     * @param {number} codAcompanhamento - Código da ação.
     * @param {string} novoStatus - Novo status ('REALIZADA' ou 'CANCELADA').
     * @returns {Promise<object>} Resultado da operação.
     */
    atualizarStatusAcao: async (codAcompanhamento, novoStatus) => {
        try {
            if (!codAcompanhamento) {
                throw new Error('Código da ação é obrigatório');
            }
            if (!['REALIZADA', 'CANCELADA'].includes(novoStatus)) {
                throw new Error('Status inválido. Deve ser REALIZADA ou CANCELADA');
            }
            const response = await fetch(`${API_BASE_URL}/api/hiperdia/atualizar_status_acao/${codAcompanhamento}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status_acao: novoStatus }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.erro || `HTTP error! status: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error('Erro ao atualizar status da ação:', error);
            throw error;
        }
    },

    /**
     * Exclui completamente uma ação.
     * @param {number} codAcompanhamento - Código da ação.
     * @returns {Promise<object>} Resultado da operação.
     */
    excluirAcao: async (codAcompanhamento) => {
        try {
            if (!codAcompanhamento) {
                throw new Error('Código da ação é obrigatório');
            }
            const response = await fetch(`${API_BASE_URL}/api/hiperdia/excluir_acao/${codAcompanhamento}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.erro || `HTTP error! status: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error('Erro ao excluir ação:', error);
            throw error;
        }
    }
};
