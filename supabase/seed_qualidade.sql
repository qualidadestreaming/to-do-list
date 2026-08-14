-- Seed inicial do departamento Qualidade + 20 colaboradores (lista do prompt
-- original) + 1 conta de teste com papel "gestor" (pra testar o painel de
-- Administração agora — quando o usuário decidir quem é o gestor real, essa
-- conta de teste pode ser desativada/renomeada pelo próprio painel).

insert into departments (name, slug, password_hash)
values ('Qualidade', 'qualidade', extensions.crypt('teste123', extensions.gen_salt('bf')));

insert into users (department_id, name, role)
select id, 'Teste Gestor', 'gestor' from departments where slug = 'qualidade';

insert into users (department_id, name, role)
select id, nome, 'colaborador'
from departments, unnest(array[
  'Verônica', 'Natalia', 'Ana Gemaque', 'Israel', 'Queren', 'AlexandreSS',
  'Carla', 'Renato', 'Josiele', 'Nayara', 'Rosiane', 'Victor', 'Oseas',
  'Anderson', 'Wilson Rocha', 'George', 'Alfredo', 'Julioney', 'Wandemberg', 'Adria'
]) as nome
where slug = 'qualidade';
