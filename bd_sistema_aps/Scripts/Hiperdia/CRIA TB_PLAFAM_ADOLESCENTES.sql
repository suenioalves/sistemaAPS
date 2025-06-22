-- sistemaaps.tb_plafam_adolescentes definição

-- Drop table

-- DROP TABLE sistemaaps.tb_plafam_adolescentes;

CREATE TABLE sistemaaps.tb_plafam_adolescentes (
	co_abordagem int4 NOT NULL,
	co_cidadao int4 NOT NULL,
	nome_adolescente varchar NULL,
	nome_responsavel varchar NULL,
	motivo_acompanhamento varchar(100) NULL,
	tipo_abordagem int4 NULL,
	resultado_abordagem int4 NULL,
	metodo_desejado int4 NULL,
	observacoes varchar(500) NULL,
	data_acao date NULL,
	responsavel_pela_acao varchar(100) NULL,
	CONSTRAINT pk_tb_plafam_adolescentes PRIMARY KEY (co_abordagem)
);