const express = require('express')
const path = require('path')
const cluster = require('cluster')
const cookieParser = require('cookie-parser');

const {
  withLogger,
  loggerWarning,
} = require('./negocio/loggers')

require('dotenv').config()

const { startWebsockets } = require('./negocio/chat');

const yargs = require('yargs/yargs')(process.argv.slice(2))

const argumentosEntrada = yargs
.boolean('debug')
.alias({
  p: 'puerto',
  f: 'FORK',
  c: 'CLUSTER'
})
.default({
  puerto: 8080,
  FORK: 'on',
  CLUSTER: 'off', 
}).argv;

const { routerProducto } = require("./rutas/producto")
 
const { routerCarrito } = require("./rutas/carrito")

const { routerUsuario } = require("./rutas/usuario")

const { routerInfo } = require('./rutas/info')

const { routerTienda } = require('./rutas/tienda');

const { routerChat } = require('./rutas/chat');

 
const app = express()

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

app.use(cookieParser());

app.use(express.static('public'))
app.use('/imagenes', express.static('imagenes'));

app.set('views', path.join(__dirname, './views'))
app.set('view engine', 'ejs');


/* ------------------------------------------------------ */
/* Cargo los routers */

app.use('/api/productos', withLogger, routerProducto)
 
app.use('/api/carrito', withLogger, routerCarrito)

app.use('/info', withLogger, routerInfo)

app.use('/chat', withLogger, routerChat);

app.use('/', withLogger, routerTienda);

app.use('/', routerUsuario);


app.use(function(req, _res) {
  // Maneja requests invalidos
  const { originalUrl, method } = req
  loggerWarning(`Ruta ${method} ${originalUrl} no implementada`);
});

/* ------------------------------------------------------ */
/* Server Listen */

const { puerto, CLUSTER } = argumentosEntrada; 

if(CLUSTER.toLowerCase() === 'on'){
  // modo cluster
  const server = app.listen(puerto, () => {
    console.log(`Servidor escuchando en el puerto ${server.address().port} modo CLUSTER`)
  })
  server.on('error', error => console.log(`Error en servidor ${error}`))
  
  
} else {
  // modo fork

    if (cluster.isPrimary) {

      const numCPUs = require('os').cpus().length;

      for (let i = 0; i < numCPUs; i++) {
        cluster.fork()
        console.log('creando una instancia nueva...')
      }
    
      cluster.on('exit', worker => {
        console.log(
          'Worker',
          worker.process.pid,
          'died',
          new Date().toLocaleString()
        )
        cluster.fork()
      })

    } else {

      const server = app.listen(puerto, () => {
        console.log(`Servidor escuchando en el puerto ${server.address().port} - PID WORKER ${process.pid}`)
      })
      server.on('error', error => console.log(`Error en servidor ${error}`))

      // Iniciar web sockets
      startWebsockets(server);

    }

}



