import express from 'express';

const router = express.Router();

router.get('/listar', (req, res) => {
    res.render('painel', {usuario: req.session.user})
})

export default router