-- Remove a view materializada se ela já existir, para evitar erros ao recriar.
DROP MATERIALIZED VIEW IF EXISTS sistemaaps.mv_hiperdia_exames;

-- Cria a nova view materializada no schema 'sistemaaps' com o nome atualizado.
CREATE MATERIALIZED VIEW sistemaaps.mv_hiperdia_exames AS

-- Inicia um Common Table Expression (CTE) para identificar todos os pacientes elegíveis (Hipertensos OU Diabéticos)
WITH PacientesElegiveis AS (
    SELECT DISTINCT 
        tprob.co_prontuario
    FROM 
        tb_problema tprob
    JOIN 
        tb_problema_evolucao tprobevol 
        ON tprobevol.co_seq_problema_evolucao = tprob.co_ultimo_problema_evolucao
    WHERE
        tprobevol.co_situacao_problema IN (0, 1) -- Problema Ativo ou Compensado
        AND (
            -- Critérios para Hipertensão
            tprob.co_ciap IN (178, 179)
            OR (tprob.co_cid10 BETWEEN 3184 AND 3197)
            OR (tprob.co_cid10 BETWEEN 12969 AND 12972)
            -- Critérios para Diabetes
            OR tprob.co_ciap IN (476, 477)
            OR (tprob.co_cid10 BETWEEN 1722 AND 1771)
            OR (tprob.co_cid10 BETWEEN 12731 AND 12735)
        )
)

-- Início da consulta principal que define os dados da view
SELECT 
    tc.co_seq_cidadao,
    tp.co_seq_prontuario,
	CASE 
		WHEN ter.dt_realizacao IS NULL THEN DATE(ter.dt_solicitacao) 
		ELSE DATE(ter.dt_realizacao) 
	END AS data_exame,
	ter.co_proced,
	tp2.no_proced AS nome_procedimento,
	CASE 
		WHEN ter.co_proced = 4524 THEN upper(ter.ds_resultado) -- glicemia
		WHEN ter.co_proced = 4506 THEN TEXT(teglicada.vl_hemoglobina_glicada) -- hemoglobina glicada
		WHEN ter.co_proced = 4500 THEN TEXT(tect.vl_colesterol_total) -- colesterol total
		WHEN ter.co_proced = 4505 THEN TEXT(techdl.vl_colesterol_hdl) -- colesterol hdl
		WHEN ter.co_proced = 4507 THEN TEXT(tecldl.vl_colesterol_ldl) -- colesterol ldl
		WHEN ter.co_proced = 199  THEN TEXT(tet.vl_triglicerideos) -- triglicerideos
		WHEN ter.co_proced = 4501 THEN TEXT(tecreatina.vl_creatina_serica) -- creatina
		WHEN ter.co_proced = 201  THEN TEXT(ter.ds_resultado) -- ureia
		WHEN ter.co_proced = 195  THEN TEXT(ter.ds_resultado) -- sodio
		WHEN ter.co_proced = 192  THEN TEXT(ter.ds_resultado) -- potassio		
		WHEN ter.co_proced = 801  THEN TEXT(ter.ds_resultado) -- taxa de filtracao glomerular		
		WHEN ter.co_proced = 862  THEN upper(ter.ds_resultado) -- eletrocardiograma
		WHEN ter.co_proced = 864  THEN upper(ter.ds_resultado) -- MRPA OU MAPA			
	END	AS resultado_exame
FROM 
    tb_exame_requisitado ter
-- Junta com o CTE para filtrar apenas exames de pacientes elegíveis
JOIN 
    PacientesElegiveis pe ON ter.co_prontuario = pe.co_prontuario
-- Joins para buscar os dados do paciente e o nome do procedimento
JOIN 
    tb_prontuario tp ON ter.co_prontuario = tp.co_seq_prontuario
JOIN 
    tb_cidadao tc ON tp.co_cidadao = tc.co_seq_cidadao
LEFT JOIN 
    tb_proced tp2 ON tp2.co_seq_proced = ter.co_proced
-- Joins específicos para cada tipo de exame para buscar o resultado estruturado
LEFT JOIN 
    tb_exame_colesterol_total tect ON ter.co_seq_exame_requisitado = tect.co_exame_requisitado
LEFT JOIN 
    tb_exame_colesterol_hdl techdl ON ter.co_seq_exame_requisitado = techdl.co_exame_requisitado
LEFT JOIN 
    tb_exame_colesterol_ldl tecldl ON ter.co_seq_exame_requisitado = tecldl.co_exame_requisitado
LEFT JOIN 
    tb_exame_triglicerideos tet ON ter.co_seq_exame_requisitado = tet.co_exame_requisitado
LEFT JOIN 
    tb_exame_hemoglobina_glicada teglicada ON ter.co_seq_exame_requisitado = teglicada.co_exame_requisitado
LEFT JOIN 
    tb_exame_creatina_serica tecreatina ON ter.co_seq_exame_requisitado = tecreatina.co_exame_requisitado
WHERE 
    ter.dt_realizacao IS NOT NULL
    AND ter.co_proced IN (4500, 4524, 862, 199, 4505, 4507, 4506, 4501, 201, 195, 192, 801, 864)

ORDER BY 
    tc.co_seq_cidadao, 
    data_exame DESC;
