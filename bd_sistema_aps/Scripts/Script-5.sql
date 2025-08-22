  SELECT
      m.nome_paciente,
      m.idade_calculada as idade,
      m.cartao_sus as cns,
      m.nome_equipe as equipe,
      m.microarea,
      ag.nome_agente as agente
  FROM sistemaaps.mv_plafam m
  LEFT JOIN sistemaaps.tb_agentes ag ON m.nome_equipe = ag.nome_equipe AND m.microarea = ag.micro_area
  WHERE m.cod_paciente IN (
      9261, 2686, 8036, 7490, 1244, 17638, 20884, 17326, 7177, 11140,
      21023, 21587, 6665, 13070, 15849, 21380, 15273, 15843, 1357, 3213,
      13978, 912, 11424, 11761, 22620, 5035, 4279, 10457, 9179, 19086,
      22928, 12010, 4363, 21876, 3897, 5555, 5822, 5410, 4327, 9379,
      22737, 2248, 10695, 18409, 9347, 7325, 3603, 23277, 1691, 2194,
      6848, 15213, 9132, 22577, 19770, 8043, 9526, 2033, 22021, 6175,
      17978, 12819, 13416, 13536
  )
  ORDER BY m.nome_paciente ASC;