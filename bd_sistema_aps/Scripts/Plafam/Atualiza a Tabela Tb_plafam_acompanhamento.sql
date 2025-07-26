-- ETAPA 1: REMOÇÃO DE PACIENTES QUE NÃO PRECISAM MAIS DE ACOMPANHAMENTO

-- 1.1: Remove pacientes da tabela de acompanhamento que não estão mais na view principal (mv_plafam).
-- Isso cobre casos de óbito, mudança de município, ou ter ultrapassado a idade de 45 anos.
DELETE FROM sistemaaps.tb_plafam_acompanhamento
WHERE co_cidadao NOT IN (SELECT cod_paciente FROM sistemaaps.mv_plafam);

-- 1.2: Remove pacientes que já estavam em acompanhamento, mas agora estão com o método em dia.
-- Isso acontece quando uma paciente (ex: com método atrasado) vai à consulta e regulariza sua situação.
DELETE FROM sistemaaps.tb_plafam_acompanhamento pa
USING sistemaaps.mv_plafam m
WHERE pa.co_cidadao = m.cod_paciente
  AND (
    -- Remove se o método for de longa duração (considerado sempre "em dia")
    m.metodo IN ('DIU', 'IMPLANTE SUBDÉRMICO', 'LAQUEADURA')
    OR
    -- Remove se o método hormonal estiver dentro do prazo de validade
    (m.metodo IN ('Pílulas', 'Mensal') AND m.data_aplicacao >= (CURRENT_DATE - INTERVAL '30 days'))
    OR
    (m.metodo = 'Trimestral' AND m.data_aplicacao >= (CURRENT_DATE - INTERVAL '90 days'))
  );


-- ETAPA 2: INSERÇÃO DE NOVOS PACIENTES ELEGÍVEIS PARA ACOMPANHAMENTO

-- Insere os pacientes que se tornaram elegíveis (sem método ou com método atrasado) e que
-- ainda não constam na tabela de acompanhamento.
INSERT INTO sistemaaps.tb_plafam_acompanhamento (
    co_cidadao,
    motivo_acompanhamento,
    status_acompanhamento,
    data_acompanhamento,
    observacoes
)
SELECT
    m.cod_paciente,
    -- Define o motivo pelo qual o paciente entra na lista de acompanhamento
    CASE
        WHEN (m.metodo IS NULL OR m.metodo = '') AND (m.status_gravidez IS NULL OR m.status_gravidez = '')
        THEN 'Paciente sem método contraceptivo ativo.'
        ELSE 'Método contraceptivo com aplicação/retirada atrasada.'
    END AS motivo_acompanhamento,
    NULL AS status_acompanhamento, -- O status inicial é nulo, a ser preenchido pelo ACS
    NULL AS data_acompanhamento,
    NULL AS observacoes -- As observações são preenchidas conforme a interação
FROM
    sistemaaps.mv_plafam m
WHERE
    -- Critério 1: Mulheres sem método preventivo e que não estão grávidas
    ((m.metodo IS NULL OR m.metodo = '') AND (m.status_gravidez IS NULL OR m.status_gravidez = ''))
    OR
    -- Critério 2: Mulheres com métodos de curta duração que estão atrasados
    (
        m.metodo IN ('Pílulas', 'Mensal', 'Trimestral')
        AND m.data_aplicacao IS NOT NULL
        AND m.data_aplicacao < (CURRENT_DATE - INTERVAL '6 months') -- Mantendo sua regra de 6 meses para busca ativa
    )
-- Se um cidadão já estiver na tabela, não faz nada.
-- Isso é crucial para não sobrescrever um acompanhamento que já está em andamento.
ON CONFLICT (co_cidadao) DO NOTHING;
