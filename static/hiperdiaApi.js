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
    fetchTimelineEvents: async (codCidadao) => {
        const response = await fetch(`${API_BASE_URL}/api/hiperdia/timeline/${codCidadao}`);
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
        const response = await fetch(`${API_BASE_URL}/api/hiperdia/registrar_acao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }
};