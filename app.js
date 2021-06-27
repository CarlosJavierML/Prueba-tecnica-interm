//1. invocar express
const express = require('express');
const app = express();


//2. seteamos urlencoded para capturar los datos del formulario 
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//3. invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({path:'./env/.env'});

//4. el directorio en public
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

//5. Establecemos el motor de plantillas ejs
app.set('view engine', 'ejs');

//6. Invocar a bcryptjs
const bcryptjs = require('bcryptjs');

//7.  Var. de session
const session = require('express-session');
app.use(session({
    secret:'secret',
    resave: true,
    saveUninitialized: true
}));

//8. Invocamnos al modulo de conexion de la BD
const connection = require('./database/db');

//9. Establecer las ructas

app.get('/login', (req, res)=> {
    res.render('login');
})

app.get('/register', (req, res)=> {
    res.render('register');
})

//10. Registracion
app.post('/register', async (req, res)=> {
    const name = req.body.name;
    const cell = req.body.cell;
    const email = req.body.email;
    const pass = req.body.pass;
    let passwordHash = await bcryptjs.hash(pass, 8);
    connection.query('INSERT INTO users SET ?', {name:name, cell:cell, email:email, pass:passwordHash}, async(error, results)=>{
        if(error){
            console.log(error);
        }else{
            res.render('register', {
                alert: true,
                alertTitle: "Registration",
                alertMessage: "¡Successful Registration!",
                alertIcon: "success",
                showComfirmButton: false,
                timer:1500,
                ruta:''
            })
        }
    })
})

//11. Autenticacion
app.post('/auth', async (req, res)=> {
    const email = req.body.email;
    const pass = req.body.pass;
    let passwordHash = await bcryptjs.hash(pass, 8);
    if(email && pass){
        connection.query('SELECT * FROM users WHERE email= ?', [email], async (error, results)=>{
            if(results.length == 0 || !(await bcryptjs.compare(pass, results[0].pass))){
                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Usuario y/o contraseña incorrectas",
                    alertIcon: "error",
                    showComfirmButton: true,
                    timer:false,
                    ruta:'login'
                })
            }else{
                req.session.loggedin = true;
                req.session.name = results[0].name
                res.render('login', {
                    alert: true,
                    alertTitle: "Conexión Exitosa",
                    alertMessage: "¡Login Corecto!",
                    alertIcon: "success",
                    showComfirmButton: false,
                    timer:1500,
                    ruta:''
                })
            }
        })
    }else{
        res.render('login', {
            alert: true,
            alertTitle: "Advertencia",
            alertMessage: "¡Por favor ingrese un usuario y/o contraseña!",
            alertIcon: "warning",
            showComfirmButton: false,
            timer:false,
            ruta:'login'
        })
    }
})

//12. Auth pages
app.get('/', (req, res)=> {
    if(req.session.loggedin){
        res.render('index', {
            login: true,
            name: req.session.name
        });
    }else{
        res.render('index', {
            login: false,
            name: 'Debe iniciar sesión'
        })
    }
})

//13. Logout
app.get('/logout', (req, res)=> {
    req.session.destroy(()=>{
        res.redirect('/')
    })
})

//Servidor
app.listen(3000,(req, res) => {
    console.log('SERVER  RUNNING IN http://localhost:3000')
})