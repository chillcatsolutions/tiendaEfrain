const { Router } = require('express');
const { getProductDAO } = require('../controlador/ControladorDaoProducto');

const routerProducto = Router();

const productController = getProductDAO();

routerProducto.get('/', async (req, res) => {
    req.loggerBase(req);
    const productos = await productController.listarAll();
    res.send(productos);
})

routerProducto.get('/:id', async (req, res) => {
    req.loggerBase(req);
    const producto = await productController.listar(req.params.id);
    res.send(producto);

});

routerProducto.post('/',async (req, res) => {
    req.loggerBase(req);
    // Si en el query viene edit entonces se actualiza el producto
    // esto es por que los formularios no dejan usar el method put
    // entonces hay que decirle al backend de otra forma que es un update
    // en este caso usando el queryString edit (mirar la ruta el formulario en html)
    if (req.query.edit) {
        try{
            const newProductData = {
                id:  req.body.id,
                name: req.body.name,
                thumbnail: req.body.thumbnail,
                price: parseFloat(req.body.price)
            };

            await productController.updateProduct(newProductData);
            res.send(`Producto actualizado: ${newProductData}`);
        }catch(e){
            res.send(`Error: ${e}`);
        }
    } else {

        await productController.createProduct(req.body);
        
        return res.status(204).json();
    }
    
})

routerProducto.use(function(req, _res) {
    // Invalid request
    const { originalUrl, method } = req
    req.loggerWarning(`Ruta ${method} ${originalUrl} no implementada`);
});


exports.routerProducto = routerProducto; 