const { Router } = require('express');
const bcrypt = require ('bcrypt');

const { auth, generateToken } = require('../negocio/auth');
const { upload } = require('../negocio/imageHandler');
const { loggerBase } = require('../negocio/loggers');

const { getUserDAO } = require('../controlador/ControladorDaoUsuario');

const usuarioController = getUserDAO();

const routerUsuario = Router();

routerUsuario.get('/', auth, async (req, res) => {
  loggerBase(req)

  try {
    if (req.user)
      res.render('index', { nombre: req.user.nombre, picture: req.user.picture  } );
    else
      res.render('login' );

  } catch (error) {
    loggerError(error);
  }
});

// LOGIN

routerUsuario.get('/login', (req, res) => {
  loggerBase(req)
  res.render('login');

});

routerUsuario.post('/login', async (req, res) => {
  loggerBase(req)
  const { nombre, password } = req.body;

  const usuarios = await usuarioController.listarAll();
  
  const usuario = usuarios.find(usuario => usuario.nombre === nombre);

  if (!usuario) {
    return res.render('login', { error: 'credenciales invalidas' });
  }
  
  let samePassword = await new Promise((resolve, reject) => {

    bcrypt.compare(password, usuario.password, function(err, result) {
      if (err) reject(err)
      resolve(result)
    });
  
  });

  if (!samePassword) {
    return res.render('login', { error: 'credenciales invalidas' });
  }

  const access_token = generateToken(usuario)

  res.render('index', {token: access_token, nombre: usuario.nombre, picture: usuario.picture })
})

routerUsuario.get('/logout', (req, res) => {
  loggerBase(req)
  res.render('login', { action: 'logout' });
})

// REGISTER
routerUsuario.post('/registro', upload.single('profile-picture'), async (req, res) => {
  loggerBase(req)
  const { nombre, password, email, age, address, countrycode, phone } = req.body

  const usuarios = await usuarioController.listarAll();
  
  const usuario = usuarios.find(usuario => usuario.nombre == nombre)
  if (usuario) {
    return res.json({ error: 'ya existe ese usuario' });
  }

  const saltRounds = 10;
  let passwordCodificado = '';
  
  const fullphone = `+${countrycode}${phone}`;

  let nuevoUsuario;

  bcrypt.genSalt(saltRounds, function(_err, salt) {
    bcrypt.hash(password, salt, async function(_err, hash) {
      // Store hash in database here
      passwordCodificado = hash;

      nuevoUsuario = {
        nombre,
        password: passwordCodificado,
        email,
        age,
        address,
        phone: fullphone,
        picture: req.file.path, 
      }

      const user = await usuarioController.createUser(nuevoUsuario);
      
      nuevoUsuario.carritoid = user.carritoid;

      const access_token = generateToken(nuevoUsuario);

      res.render('index', {token: access_token, nombre, picture: req.file.path });

    });
  });
      
  
})

routerUsuario.get('/registro', (req, res) => {
  loggerBase(req)
  res.render('registro');
});

exports.routerUsuario = routerUsuario; 