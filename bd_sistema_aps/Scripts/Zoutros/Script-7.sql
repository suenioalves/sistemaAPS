-- Limpa a tabela de acompanhamento para recarregar os pacientes elegíveis.
-- O TRUNCATE é rápido e eficiente para zerar a tabela antes de uma nova carga.
TRUNCATE TABLE sistemaaps.tb_plafam_acompanhamento;

-- Insere os pacientes que precisam de acompanhamento na tabela
INSERT INTO sistemaaps.tb_plafam_acompanhamento (
    co_cidadao,
    motivo_acompanhamento,
    status_acompanhamento,
    observacoes
)
SELECT
    m.cod_paciente,
    -- Define o motivo pelo qual o paciente está na lista de acompanhamento
    CASE
        WHEN (m.metodo IS NULL OR m.metodo = '') AND (m.status_gravidez IS NULL OR m.status_gravidez = '')
        THEN 'Sem método preventivo ou não gestante.'
        ELSE 'Método contraceptivo atrasado (mais de 6 meses).'
    END AS motivo_acompanhamento,
    NULL AS status_acompanhamento, -- O status inicial é nulo, a ser preenchido pelo ACS
    NULL AS observacoes -- As observações são preenchidas conforme a interação
FROM
    sistemaaps.mv_plafam m
WHERE
    -- Critério 1: Mulheres sem método preventivo e que não estão grávidas
    ((m.metodo IS NULL OR m.metodo = '') AND (m.status_gravidez IS NULL OR m.status_gravidez = ''))
    OR
    -- Critério 2: Mulheres com métodos de curta duração que estão atrasados há mais de 6 meses
    (
        m.metodo IN ('Pílulas', 'Mensal', 'Trimestral')
        AND m.data_aplicacao IS NOT NULL -- Garante que a data existe para comparação
        AND m.data_aplicacao < (CURRENT_DATE - INTERVAL '6 months') -- Compara diretamente com o tipo DATE
    )
-- Se um cidadão já estiver na tabela (de uma execução anterior ou manual), não faz nada.
-- Isso evita erros de chave duplicada e mantém os dados existentes se a tabela não for truncada.
ON CONFLICT (co_cidadao) DO NOTHING;

