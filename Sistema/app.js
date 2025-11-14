import express from 'express'
import bodyParser from 'body-parser'
import session from 'express-session'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')))

app.use(session({
    secret: process.env.SESSION_SECRET || 'segredo123',
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 30 * 60 * 1000} //desloga a cada 30 minutos
}));

function checkAuth(req, res, next){
    if(res.session.user) return next();
    res.redirect('/auth/login');
}

//importar rotas
import loginRotas from './routes/loginRoutes.js';
import painelRotas from './routes/painelRoutes.js';
import produtosRotas from './routes/produtosRoutes.js'
import movRotas from './routes/movRoutes.js'


//usando rotas
app.use('/auth', loginRotas);
app.use('/painel', painelRotas);
app.use('/produtos', produtosRotas);
app.use('/movimentacoes', movRotas);

app.get('/', (req, res) => {
    res.render('login', {error: null})
})


app.listen(3000, () => console.log("🚀 Sistema rodando em http://localhost:3000"))


