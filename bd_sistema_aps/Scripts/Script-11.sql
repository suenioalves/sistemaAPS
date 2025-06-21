select distinct
	tc2.co_seq_cidadao, -- nome
	date (tm.dt_medicao) as datamedicao,
	tm.nu_medicao_peso,
	tm.nu_medicao_altura,
	tm.nu_medicao_imc,
	tm.tp_glicemia, -- jejum, pos prandial
	tm.nu_medicao_glicemia,
	tm.nu_medicao_pressao_arterial,
	tm.nu_medicao_frequencia_cardiaca,
	tm.nu_medicao_saturacao_o2
from tb_cidadao tc2
	inner join tb_prontuario tp2 on tp2.co_cidadao = tc2.co_seq_cidadao -- retorna o prontuario do cidadao
	inner join tb_atend ta2 on ta2.co_prontuario = tp2.co_seq_prontuario -- retorna todos os atendimentos referente a este prontuario
	left join tb_atend_prof tap2 on tap2.co_atend = ta2.co_seq_atend
	left join tb_medicao tm on tm.co_atend_prof = tap2.co_seq_atend_prof
where
	current_date - date (tm.dt_medicao) < 365 -- retornar os dados dos exames fisicos no ultimo ano 
order by co_seq_cidadao 