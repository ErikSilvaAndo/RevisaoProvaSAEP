import express from 'express';
import bd from '../bd.js';

const router = express.Router();

// Gestão de estoque
router.get('/listar', async (req, res) => {
    const { busca } = req.query;
    let sql = "SELECT m.id_mov, m.tipo, m.quantidade, m.data_cadastro, p.nome_produto, p.quantidade as qtde_produto FROM movimentacoes m LEFT JOIN produtos p on m.id_produto = p.id_produto";
    let params = [];
    if (busca) {
        sql += " WHERE p.nome_produto ILIKE $1";
        params.push(`%${busca}%`);
    }
    sql += " ORDER BY p.nome_produto ASC";
    const result = await bd.query(sql, params);
    res.render('movimentacoes/listar', { usuario: req.session.user, movimentacoes: result.rows, busca });
});

router.get('/novo', async (req, res) => {
    const produtos = await bd.query("SELECT * FROM produtos ORDER BY nome_produto ASC");
    res.render('movimentacoes/novo', { usuario: req.session.user, produtos: produtos.rows });
});

router.post('/novo', async (req, res) => {
    const { id_produto, tipo, quantidade } = req.body;
    const qtd = parseInt(quantidade);

    const prod = await bd.query("SELECT * FROM produtos WHERE id_produto=$1", [id_produto]);
    // if (prod.rowCount === 0) return res.redirect('/estoque');

    let novaQt = prod.rows[0].quantidade;
    if (tipo === 'E') novaQt += qtd;
    if (tipo === 'S') novaQt -= qtd;

    await bd.query("UPDATE produtos SET quantidade=$1 WHERE id_produto=$2", [novaQt, id_produto]);
    await bd.query("INSERT INTO movimentacoes (id_produto, tipo, quantidade) VALUES ($1,$2,$3)",
        [id_produto, tipo, qtd]);

    let mensagem = null;
    if (novaQt < prod.rows[0].estoque_minimo) mensagem = "⚠️ Estoque abaixo do mínimo!";
    const busca = null;
    res.redirect('/movimentacoes/listar');
});

router.get('/editar/:id', async (req, res) => {
    const { id } = req.params;
    const mov = await bd.query(`
    SELECT m.id_mov, m.tipo, m.quantidade, m.data_cadastro, 
           p.id_produto, p.nome_produto, p.quantidade as qtde_produto 
    FROM movimentacoes m 
    LEFT JOIN produtos p ON m.id_produto = p.id_produto 
    WHERE id_mov=$1
  `, [id]);

    if (mov.rowCount === 0) return res.redirect('/movimentacoes/listar');

    const produtos = await bd.query("SELECT id_produto, nome_produto FROM produtos ORDER BY nome_produto");

    res.render('movimentacoes/editar', {
        usuario: req.session.user,
        m: mov.rows[0],
        produtos: produtos.rows
    });
});


router.post('/editar/:id', async (req, res) => {
    const { id_produto, tipo, quantidade } = req.body;
    const id = req.params.id;
    const qtdNova = parseInt(quantidade);

    try {
        // Busca movimentação original
        const mov = await bd.query("SELECT * FROM movimentacoes WHERE id_mov=$1", [id]);
        if (mov.rowCount === 0) return res.redirect('/movimentacoes/listar');

        const movAntiga = mov.rows[0];
        const qtdAntiga = movAntiga.quantidade;

        // Busca produto
        const prod = await bd.query("SELECT * FROM produtos WHERE id_produto=$1", [id_produto]);
        if (prod.rowCount === 0) return res.redirect('/estoque');

        let novaQt = prod.rows[0].quantidade;

        // Remove efeito da movimentação antiga
        if (movAntiga.tipo === 'E') novaQt -= qtdAntiga;
        if (movAntiga.tipo === 'S') novaQt += qtdAntiga;

        // Aplica efeito da movimentação nova
        if (tipo === 'E') novaQt += qtdNova;
        if (tipo === 'S') novaQt -= qtdNova;

        // Atualiza produto
        await bd.query("UPDATE produtos SET quantidade=$1 WHERE id_produto=$2", [novaQt, id_produto]);

        // Atualiza movimentação
        await bd.query("UPDATE movimentacoes SET id_produto=$1, tipo=$2, quantidade=$3 WHERE id_mov=$4",
            [id_produto, tipo, qtdNova, id]);

        // Verifica estoque mínimo
        let mensagem = null;
        if (novaQt < prod.rows[0].estoque_minimo) mensagem = "⚠️ Estoque abaixo do mínimo!";

        res.redirect('/movimentacoes/listar');
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao editar movimentação");
    }
});



router.post('/excluir/:id', async (req, res) => {
    const { id } = req.params;

    // Busca a movimentação antes de excluir
    const mov = await bd.query("SELECT * FROM movimentacoes WHERE id_mov=$1", [id]);
    if (mov.rowCount === 0) {
        return res.redirect('/movimentacoes/lista'); // Não encontrada
    }

    const { id_produto, tipo, quantidade } = mov.rows[0];

    // Busca o produto para ajustar quantidade
    const prod = await bd.query("SELECT * FROM produtos WHERE id_produto=$1", [id_produto]);
    if (prod.rowCount === 0) {
        return res.redirect('/movimentacoes/lista'); // Produto não encontrado
    }

    let novaQt = prod.rows[0].quantidade;

    // Ajusta conforme tipo da movimentação
    if (tipo === 'S') {
        novaQt += quantidade; // devolve estoque
    } else if (tipo === 'E') {
        novaQt -= quantidade; // retira estoque
    }

    // Atualiza produto
    await bd.query("UPDATE produtos SET quantidade=$1 WHERE id_produto=$2", [novaQt, id_produto]);

    // Exclui movimentação
    await bd.query("DELETE FROM movimentacoes WHERE id_mov=$1", [id]);

    res.redirect('/movimentacoes/listar');
});

export default router;