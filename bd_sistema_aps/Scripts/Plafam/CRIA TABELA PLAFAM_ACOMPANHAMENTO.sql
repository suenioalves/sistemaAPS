-- sistemaaps.tb_plafam_acompanhamento definição

-- Drop table

-- DROP TABLE sistemaaps.tb_plafam_acompanhamento;

CREATE TABLE sistemaaps.tb_plafam_acompanhamento (
	co_cidadao int4 NOT NULL,
	motivo_acompanhamento varchar(100) NULL,
	status_acompanhamento int4 NULL,
	observacoes varchar(500) NULL,
	data_acompanhamento date NULL,
	CONSTRAINT pk_tb_plafam PRIMARY KEY (co_cidadao)
);