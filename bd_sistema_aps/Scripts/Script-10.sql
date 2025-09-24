SELECT tc.* FROM public.tb_cidadao AS tc
WHERE st_ativo = 1 AND (st_faleceu = 0)