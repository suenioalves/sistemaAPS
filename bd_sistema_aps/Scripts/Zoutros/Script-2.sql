    SELECT
        tc.co_seq_cidadao AS codcidadao,
        tp.co_seq_prontuario as codprontuario,
        tm.no_principio_ativo as medicamento,
        trm.qt_dose,
        trm.ds_frequencia_dose,
        trm.st_uso_continuo,
        trm.tp_frequencia_dose,
        trm.no_posologia as posologia,
        trm.dt_inicio_tratamento
    FROM
        tb_cidadao tc
    LEFT JOIN tb_prontuario tp ON tc.co_seq_cidadao = tp.co_cidadao
	LEFT JOIN tb_atend ta ON ta.co_prontuario = tp.co_seq_prontuario  
	LEFT JOIN tb_receita_medicamento trm ON trm.co_atend_prof = ta.co_atend_prof 
	LEFT JOIN tb_medicamento tm ON tm.co_seq_medicamento = trm.co_medicamento
    WHERE
    	trm.co_medicamento = 1785 and dt_inicio_tratamento > '2025-01-01'
    
    	