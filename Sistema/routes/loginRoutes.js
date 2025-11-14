import express from 'express';
import bd from '../bd.js';

const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login')
})

router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    const result = await bd.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    const usuario = result.rows[0]
    if (result.rowCount == 0 || senha !== usuario.senha) {
        return res.render('login')
    }
    req.session.user = usuario;
    res.redirect('/painel/listar')
})

router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/auth/login'))
})

export default router;