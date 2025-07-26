select tc.co_seq_cidadao as codigo,
tc.no_cidadao as nome,
ta.dt_inicio as dataaplicacao,
case  
when ((tp3.co_cid10 = 14171 or tp3.co_cid10 = 11974) and tm.no_principio_ativo is null) then 'Não deseja usar no momento.'
when tm.no_principio_ativo like '%Etinilestradiol%' then 'Via Oral (Pilulas) - Combinados.'
when tm.no_principio_ativo like 'Noretisterona, Enantato de + Estradiol, Valerato de'  and tm.co_forma_farmaceutica = 82 then 'Injetável Mensal.'
when tm.no_principio_ativo like 'Medroxiprogesterona, Acetato'  and tm.co_forma_farmaceutica = 82 then 'Injetável Trimestral.'
when tc2.no_cid10 like '%MENOPAUSA%' then 'Menopausa.'
when tp3.co_ciap = 634 and tpe.co_situacao_problema <> 2 then 'Gestação.' 
when tc2.no_cid10 like '%INFERT%' then 'Infertilidade.'
when upper(tci.ds_cirurgia_internacao) like ('%HISTER%') then 'Histerectomia.' 
when upper(tci.ds_cirurgia_internacao) like ('%LAQUEADUR%') then 'Laqueadura.' 
when upper(tci.ds_cirurgia_internacao) like ('%LIGAD%') then 'Laqueadura.'
when tc2.no_cid10 like '%[DIU]%' or tc3.no_cid10 like '%INTRA-UTERINO%' then 'Dispositivo Intra-uterino [DIU].'
when tc3.no_cid10 like '%[DIU]%' or tc3.no_cid10 like '%INTRA-UTERINO%' then 'Dispositivo Intra-uterino [DIU].'
when upper(tep.ds_plano) like ('%NENHUM MÉTODO%') then 'Não deseja usar nenhum método.' -- pequisa se foi escrito nenhum método no campo
end  contracepcao,
tm.no_principio_ativo as medicamentousado
from tb_cidadao tc
left join tb_prontuario tp on  tc.co_seq_cidadao = tp.co_cidadao -- relacao prontuario x cidadao
left join tb_problema tp3 on tp3.co_prontuario = tp.co_seq_prontuario -- retorna da tb_problema se as pacientes que tem menopausa, gravidez, infertilidade
	and (tp3.co_cid10 = 13342 -- menopausa
	  or tp3.co_cid10 = 14174 -- gravidez
	  or tp3.co_cid10 = 13343) -- infertilidade
left join tb_cid10 tc2 on tc2.co_cid10 = tp3.co_cid10 
left join tb_problema_evolucao tpe on tpe.co_seq_problema_evolucao = tp3.co_ultimo_problema_evolucao -- retorna se o atual problema está ATIVO ou não
left join tb_atend ta on ta.co_prontuario = tp.co_seq_prontuario  -- para retornar a data da aplcacao
left join rl_evolucao_avaliacao_ciap_cid reacc on reacc.co_atend_prof = ta.co_atend_prof
	and (reacc.co_cid10 = 14171 -- cid z30 - anticocepcao geral
	  or reacc.co_cid10 = 11974 -- cid z300 - aconselhamento geral sobre anticoncepcao
	  or reacc.co_cid10 = 11975 -- cid z301 - inserção de DIU
	  or reacc.co_cid10 = 11976 -- cid z302 - esterilização
	  or reacc.co_cid10 = 11978 -- cid z304 - supervisao de uso de medicamentos anticoncepcionais
	  or reacc.co_cid10 = 11979 -- cid z305 - supervisao de diu
	  or reacc.co_cid10 = 11980 -- cid z308 - outro procedimento anticoncepcional
	  or reacc.co_cid10 = 11981 -- cid z309 - procedimentos anticoncepcional não especificado
	  or reacc.co_cid10 = 12439) -- cd z975 - presença de diu   
left join tb_cid10 tc3 on tc3.co_cid10 = reacc.co_cid10
left join tb_cirurgias_internacoes tci on tci.co_prontuario = tp.co_seq_prontuario 
	and (upper(tci.ds_cirurgia_internacao) like ('%HISTER%') -- pesquisa se foi inserido histerectomia
	or  upper(tci.ds_cirurgia_internacao) like ('%LAQUEADUR%') -- se foi inserido laqueadura ou ligadura como termo
	or  upper(tci.ds_cirurgia_internacao) like ('%LIGAD%'))
left join tb_receita_medicamento trm on trm.co_atend_prof  = ta.co_atend_prof 
left join tb_medicamento tm on tm.co_seq_medicamento = trm.co_medicamento
		and (       tm.no_principio_ativo like '%Etinilestradiol%' 
				or (tm.no_principio_ativo like 'Noretisterona, Enantato de + Estradiol, Valerato de')
				or (tm.no_principio_ativo like 'Medroxiprogesterona, Acetato'))
left join tb_evolucao_plano tep on tep.co_atend_prof = ta.co_atend_prof 
where 
tc.no_sexo ='FEMININO' -- so retorna mulheres com mais de 14 anos de idade 
and extract(year from age(tc.dt_nascimento)) > 14 -- definido como idade que se pode oferecer anticoncepcao
and ((reacc.co_cid10 is not null) or (tp3.co_cid10 is not null) or (tci.ds_cirurgia_internacao is not null) )
order by co_seq_cidadao

