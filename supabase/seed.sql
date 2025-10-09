
CREATE TABLE chart_of_accounts (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL
);
