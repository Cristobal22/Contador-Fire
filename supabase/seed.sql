
CREATE TABLE account_groups (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

INSERT INTO account_groups (name) VALUES
('Activo'),
('Pasivo'),
('Patrimonio'),
('Resultado');

CREATE TABLE chart_of_accounts (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL
);
