  SELECT
      tc.co_seq_cidadao AS codigo,
      tc.no_cidadao AS nome,
      CASE
          WHEN ter.dt_realizacao IS NULL THEN DATE(ter.dt_solicitacao)
          ELSE DATE(ter.dt_realizacao)
      END AS data_coleta,
      teglicada.vl_hemoglobina_glicada AS hemoglobina_glicada,
      ROW_NUMBER() OVER (
          PARTITION BY tc.co_seq_cidadao
          ORDER BY
              CASE
                  WHEN ter.dt_realizacao IS NULL THEN ter.dt_solicitacao
                  ELSE ter.dt_realizacao
              END DESC
      ) AS rn
  FROM tb_cidadao tc
  LEFT JOIN tb_prontuario tp
      ON tc.co_seq_cidadao = tp.co_cidadao
  LEFT JOIN tb_exame_requisitado ter
      ON ter.co_prontuario = tp.co_seq_prontuario
  LEFT JOIN tb_exame_hemoglobina_glicada teglicada
      ON ter.co_seq_exame_requisitado = teglicada.co_exame_requisitado
  WHERE
      teglicada.vl_hemoglobina_glicada IS NOT NULL
      AND ter.co_proced = 4506  -- Código específico para hemoglobina glicada
      AND (ter.dt_realizacao >= NOW() - INTERVAL '12 months'
           OR ter.dt_solicitacao >= NOW() - INTERVAL '12 months')
  ORDER BY
      tc.co_seq_cidadao,
      CASE
          WHEN ter.dt_realizacao IS NULL THEN ter.dt_solicitacao
          ELSE ter.dt_realizacao
      END DESC;