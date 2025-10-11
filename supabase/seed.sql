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

CREATE TABLE institutions (
    id SERIAL PRIMARY KEY,
    code TEXT,
    name TEXT,
    type TEXT,
    cotizacion_obligatoria NUMERIC,
    codigo_previred TEXT,
    codigo_direccion_del_trabajo TEXT,
    regimen_previsional TEXT
);

INSERT INTO institutions (code, name, type, cotizacion_obligatoria, codigo_previred, codigo_direccion_del_trabajo) VALUES
('BANM', 'Banmedica', 'isapre', 7.00, '01', '3'),
('BEST', 'BANCO ESTADO', 'isapre', 7.00, '12', '40'),
('CMN', 'Colmena', 'isapre', 7.00, '04', '4'),
('cons', 'Consalud', 'isapre', 7.00, '02', '9'),
('CRZB', 'CRUZ BLANCA', 'isapre', 7.00, '05', '1'),
('ESE', 'ESENCIAL', 'isapre', 7.00, '28', '44'),
('fona', 'Fonasa', 'fonasa', 7.00, '07', '102'),
('ISAL', 'ISAPRE ISALUD', 'isapre', 7.00, '11', '5'),
('MAS2', 'NUEVA MASVIDA', 'isapre', 7.00, '10', '43'),
('masv', 'NO VIGENTE Mas Vida', 'isapre', 7.00, '17', '43'),
('SIN', 'SIN ISAPRE', 'isapre', 0.00, '00', '102'),
('VID3', 'VIDA TRES', 'isapre', 7.00, '03', '12');

INSERT INTO institutions (code, name, type, cotizacion_obligatoria, codigo_previred, regimen_previsional, codigo_direccion_del_trabajo) VALUES
('CUMP', 'Cuprum', 'afp', 11.44, '03', 'AFP', '13'),
('EMPA', 'Empart.', 'afp', 21.84, '0101', 'INP', '85'),
('HABI', 'Habitat', 'afp', 11.27, '05', 'AFP', '14'),
('MODE', 'Modelo', 'afp', 10.58, '34', 'AFP', '103'),
('PROV', 'Provida', 'afp', 11.45, '08', 'AFP', '6'),
('PVIT', 'Plan Vital', 'afp', 11.16, '29', 'AFP', '11'),
('SIN', 'SIN AFP', 'afp', 0.00, '00', 'SIP', '100'),
('SSS', 'Servicio Seguro social', 'afp', 18.84, '09', 'INP', '105'),
('STMA', 'Capital', 'afp', 11.44, '33', 'AFP', '31'),
('UNO', 'UNO', 'afp', 10.49, '35', 'AFP', '19');


CREATE TABLE monthly_parameters (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    name TEXT NOT NULL,
    value NUMERIC NOT NULL
);

-- Default monthly parameters for a new company
INSERT INTO monthly_parameters (company_id, name, value) VALUES
(1, 'IVA', 0.19);
