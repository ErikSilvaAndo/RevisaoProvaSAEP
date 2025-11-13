CREATE DATABASE estoque_aula;

CREATE TABLE IF NOT EXISTS usuarios(
	id_usuario SERIAL PRIMARY KEY,
	email VARCHAR(100) NOT NULL,
	senha VARCHAR(60) NOT NULL,
	ativo BOOLEAN DEFAULT TRUE NOT NULL
);

INSERT INTO usuarios (email, senha) VALUES('bolinhaDQ@gmail.com', '1234') RETURNING *
SELECT * FROM usuarios

CREATE TABLE IF NOT EXISTS produtos (
	id_produto SERIAL PRIMARY KEY,
	nome_produto VARCHAR(100) NOT NULL,
	quantidade INTEGER DEFAULT 0 NOT NULL,
	estoque_minimo INTEGER DEFAULT 1 NOT NULL,
	data_cadastro TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS movimentacoes (
	id_mov SERIAL PRIMARY KEY,
	id_produto INTEGER NOT NULL REFERENCES produtos(id_produto) ON UPDATE cascade on DELETE RESTRICT,
	tipo CHAR(1) NOT NULL CHECK (tipo IN ('E', 'S')),
	quantidade INTEGER NOT NULL CHECK (quantidade > 0),
	data_cadastro TIMESTAMP DEFAULT NOW() NOT NULL
);