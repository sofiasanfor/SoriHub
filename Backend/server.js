const crypto = require("crypto")
const express = require("express")
const path = require("path")
const mongoose = require("mongoose")
const multer = require("multer")
const streamifier = require("streamifier");
const ExcelJS = require("exceljs")
const nodemailer = require("nodemailer")


const app = express()
app.use("/webhook/wompi", express.raw({
type: "*/*"
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const Carrusel = mongoose.model("Carrusel",{
  productos: [String] // guardamos IDs
})

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const transporter = nodemailer.createTransport({

service:"gmail",

auth:{
user:"sensify.tienda@gmail.com",
pass:process.env.GMAIL_APP_PASSWORD
}

})

// CONEXION
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("Mongo conectado");

  app.listen(process.env.PORT || 3000, () => {
    console.log("Servidor corriendo");
  });

})
.catch(err => {
  console.log("Error Mongo:", err);
});

// MULTER
const storage = multer.memoryStorage();
const upload = multer({
storage:storage,
limits:{fileSize:5*1024*1024},
fileFilter:(req,file,cb)=>{
const tipos = [
"image/jpeg",
"image/png",
"image/webp",
"image/svg+xml"
]

if(tipos.includes(file.mimetype)){
cb(null,true)
}else{
cb(new Error("Tipo de archivo no permitido"), false)
}
}
})


// MODELOS
// SOLO TE MARCO LO NUEVO (lo demás déjalo igual)

// MODELO (IMPORTANTE)
const Producto = mongoose.model("Producto",{
nombre:String,
precio:Number,
descripcion:String,
descripcionLarga:String,
info:String,
caracteristicas:String,
modoUso:String,
recomendaciones:String,
imagenes:[String],
stock:Number,
categoria:String,
tallas:[String],
vistas:{type:Number, default:0},
promo:Boolean,
descuento:{ type:Number, default:0 },
precioPromo:Number
})

const Kit = mongoose.model("Kit",{

nombre:String,

descripcion:String,

precio:Number,

imagen:String,

productos:[
{
productoId:String,
cantidad:Number
}
]

})

const Contador = mongoose.model("Contador",{
  nombre: String,
  valor: Number
})

// NUEVA RUTA 👇
app.post("/productos/vista/:id", async (req,res)=>{

let producto = await Producto.findById(req.params.id)

if(!producto) return res.send("no existe")

producto.vistas += 1
await producto.save()

res.send("ok")

})

const Pedido = mongoose.model("Pedido",{

numero:Number,
usuario:String,
lugar:String,
referencia:String,
productos:Array,
total:Number,
fecha: Date,

estado:{
type:String,
default:"pendiente"
},

datosEnvio:{

nombreCompleto:String,
telefono:String,
direccion:String,
complemento:String,
departamento:String,
municipio:String,
barrio:String,
apartamento:String

}

})

const PedidoTemporal = mongoose.model("PedidoTemporal",{

referencia:String,

usuario:String,

productos:Array,

total:Number,

datosEnvio:Object,

fecha:{
type:Date,
default:Date.now
}

})

app.delete("/pedidos/enviados", verificarAdmin, async (req,res)=>{
  try{

    await Pedido.deleteMany({ estado: "enviado" })

    res.json({ ok: true })

  }catch(e){
    console.error(e)
    res.status(500).json({ error: "Error eliminando" })
  }
})

app.put("/pedido/:id", verificarAdmin, async (req,res)=>{

try{

let pedido = await Pedido.findById(req.params.id)

if(!pedido){
return res.status(404).send("no existe")
}

pedido.estado = "enviado"

await pedido.save()

res.json({mensaje:"actualizado"})

}catch(e){

console.log(e)
res.status(500).send("error")

}

})

app.get("/kits", async (req,res)=>{

try{

let kits = await Kit.find()

res.json(kits)

}catch(e){

console.log(e)
res.status(500).send("error")

}

})

app.post("/kits", verificarAdmin, async (req,res)=>{

try{

let nuevo = new Kit({

nombre:req.body.nombre,

descripcion:req.body.descripcion,

precio:Number(req.body.precio),

imagen:req.body.imagen,

productos:req.body.productos || []

})

await nuevo.save()

res.send("kit creado")

}catch(e){

console.log(e)
res.status(500).send("error creando kit")

}

})

app.post("/comentarios", async (req, res) => {
  let { productoId, texto, estrellas } = req.body

  let nuevo = new Comentario({
    productoId,
    texto,
    estrellas,
    fecha: new Date()
  })

  await nuevo.save()

  res.json({ ok: true })
})

app.get("/comentarios/:id", async (req, res) => {

  let comentarios = await Comentario.find({
    productoId: req.params.id
  }).sort({ fecha: -1 })

  res.json(comentarios)
})

app.get("/compras", async(req,res)=>{
let compras = await Compra.find()
.sort({fecha:-1})
res.json(compras)
})

const Comentario = mongoose.model("Comentario", {
  productoId: String,
  texto: String,
  estrellas: Number,
  fecha: Date
})

app.delete("/comentarios/:id", async (req, res) => {

try{

let comentario = await Comentario.findById(req.params.id)

if(!comentario){
  return res.status(404).json({error:"no existe"})
}

await Comentario.findByIdAndDelete(req.params.id)

res.json({ ok: true })

}catch(e){
console.log(e)
res.status(500).json({ error: "Error eliminando comentario" })
}

})

app.delete("/comentarios/:id", async (req,res)=>{
  try{

    await Comentario.findByIdAndDelete(req.params.id)

    res.json({ ok:true })

  }catch(e){
    console.log(e)
    res.status(500).json({ ok:false })
  }
})

const Usuario = mongoose.model("Usuario",{
nombre:String,
apellido:String,
correo:String,
password:String,
rol:String,
anonimo:{ type:Boolean, default:true },
foto:String,
foto_id:String,

resetToken:String,
resetExpira:Date

})

const Carrito = mongoose.model("Carrito",{
usuario:String,
productos:[
{
productoId:String,
nombre:String,
precio:Number,          // precio FINAL
precioOriginal:Number,  // antes del descuento
descuento:Number,
promo:Boolean,
cantidad:Number,
imagen:String,
agotado:Boolean
}
]
})

const Colores = mongoose.model("Colores",{
  principal:String,
  secundario:String,
  acento:String,
  texto:String,
  card:String
})

const Banner = mongoose.model("Banner", {
imagenes: [String]
})

const Extras = mongoose.model("Extras",{
imagenes:[String]
})

const Categorias = mongoose.model("Categorias",{

estimulantes:String,
lubricantes:String,
juguetes:String,
lenceria:String,    
cuidado_intimo:String,
juegos_eroticos:String,
todo:String

})

const LugarPedido = mongoose.model("LugarPedido",{
nombre:String
})

const Proveedor = mongoose.model("Proveedor",{
nombre:String
})

const Compra = mongoose.model("Compra",{

productoId:String,

producto:String,

cantidad:Number,

precioCompra:Number,

iva:{
type:Number,
default:0
},

descuento:{
type:Number,
default:0
},

total:Number,

proveedor:String,

fecha:{
type:Date,
default:Date.now
}

})

app.post("/agregar-compra", async(req,res)=>{

try{

let {
productoId,
cantidad,
precio,
proveedor,
iva,
descuento
} = req.body

cantidad = Number(cantidad)
precio = precio.toString().replaceAll(".", "")
precio = Number(precio)
iva = Number(iva || 0)
descuento = Number(descuento || 0)

let producto = await Producto.findById(productoId)

if(!producto){

return res.status(404).json({
error:"Producto no encontrado"
})

}

producto.stock += cantidad

await producto.save()

let subtotal = cantidad * precio

let base =
subtotal -
(subtotal * descuento / 100)

let total =
base +
(base * iva / 100)

let compra = new Compra({

productoId,

producto: producto.nombre,

cantidad,

precioCompra: precio,

iva,

descuento,

total,

proveedor

})

await compra.save()

res.json({
ok:true
})

}catch(e){

console.log(e)

res.status(500).json({
error:"Error guardando compra"
})

}

})

app.put("/productos/:id", upload.array("imagenes", 6), async (req,res)=>{
try{

let producto = await Producto.findById(req.params.id)
if(!producto) return res.status(404).send("no existe")
let data = req.body

  // 🔥 convertir tipos correctamente
  if(data.promo !== undefined){
    data.promo = data.promo === "true"
  }

  if(data.descuento !== undefined){
    data.descuento = Number(data.descuento)
  }

  if(data.precioPromo !== undefined){
    data.precioPromo = Number(data.precioPromo)
  }

  if(data.stock !== undefined){
    data.stock = Number(data.stock)
  }

// 🔥 imágenes actuales (ordenadas desde frontend)
let imagenesActuales = []

if(req.body.imagenesActuales){

  if(typeof req.body.imagenesActuales === "string"){
    imagenesActuales = JSON.parse(req.body.imagenesActuales)
  }else{
    imagenesActuales = req.body.imagenesActuales
  }

}
// 🔥 subir nuevas imágenes
let nuevas = []

if(req.files && req.files.length > 0){

  for (let file of req.files) {

    let resultado = await new Promise((resolve, reject)=>{
      const stream = cloudinary.uploader.upload_stream(
        { folder: "sensify" },
        (error, result)=>{
          if(result) resolve(result);
          else reject(error);
        }
      );

      streamifier.createReadStream(file.buffer).pipe(stream);
    });

    nuevas.push(resultado.secure_url);
  }
}

// 🔥 combinar
// 🔥 SOLO actualizar imágenes si vienen cambios
if(req.body.imagenesActuales || (req.files && req.files.length > 0)){

  let imagenesActuales = []

  if(req.body.imagenesActuales){
    if(typeof req.body.imagenesActuales === "string"){
      imagenesActuales = JSON.parse(req.body.imagenesActuales)
    }else{
      imagenesActuales = req.body.imagenesActuales
    }
  }else{
    imagenesActuales = producto.imagenes // 👈 mantener las existentes
  }

  let nuevas = []

  if(req.files && req.files.length > 0){
    for (let file of req.files) {
      let resultado = await new Promise((resolve, reject)=>{
        const stream = cloudinary.uploader.upload_stream(
          { folder: "sensify" },
          (error, result)=>{
            if(result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
      });

      nuevas.push(resultado.secure_url);
    }
  }

  producto.imagenes = [...imagenesActuales, ...nuevas]
}

// 🔥 actualizar todo
if(req.body.nombre !== undefined)
  producto.nombre = req.body.nombre

if(req.body.precio !== undefined)
  producto.precio = Number(req.body.precio)

if(req.body.descripcion !== undefined)
  producto.descripcion = req.body.descripcion

if(req.body.descripcionLarga !== undefined)
  producto.descripcionLarga = req.body.descripcionLarga

if(req.body.info !== undefined)
  producto.info = req.body.info

if(req.body.caracteristicas !== undefined)
  producto.caracteristicas = req.body.caracteristicas

if(req.body.modoUso !== undefined)
  producto.modoUso = req.body.modoUso

if(req.body.recomendaciones !== undefined)
  producto.recomendaciones = req.body.recomendaciones

if(req.body.stock !== undefined){
  producto.stock = Number(req.body.stock) || 0
}
if(req.body.categoria !== undefined){
  producto.categoria = req.body.categoria
}

// 🔥 PROMO (ARREGLA TODO)

if(req.body.promo !== undefined){
  producto.promo = req.body.promo === "true" || req.body.promo === true
}

if(req.body.descuento !== undefined){
  producto.descuento = Number(req.body.descuento) || 0
}

if(req.body.precioPromo !== undefined){
  producto.precioPromo = Number(req.body.precioPromo) || 0
}

await producto.save()

res.send("Producto actualizado")

}catch(e){
console.log("ERROR EDITAR:", e)
res.status(500).send("error")
}
})

app.delete("/compra/:id", async(req,res)=>{

try{

await Compra.findByIdAndDelete(
req.params.id
)

res.json({
ok:true
})

}catch(e){

console.log(e)

res.status(500).json({
ok:false
})

}
})

app.post("/banner", verificarAdmin, upload.array("imagenes",10), async (req,res)=>{
try{

let banner = await Banner.findOne()

if(!banner){
  banner = new Banner({
    imagenes:[]
  })
}

let imagenesActuales = []

// 🔥 imágenes que el usuario decidió conservar
if(req.body.imagenesActuales){

  if(typeof req.body.imagenesActuales === "string"){
    imagenesActuales = JSON.parse(req.body.imagenesActuales)
  }else{
    imagenesActuales = req.body.imagenesActuales
  }

}else{
  imagenesActuales = banner.imagenes || []
}

// 🔥 subir nuevas
let nuevas = []

if(req.files && req.files.length > 0){

  for(let file of req.files){

    let resultado = await new Promise((resolve,reject)=>{

      const stream = cloudinary.uploader.upload_stream(
        { folder:"sensify/banner" },
        (error,result)=>{
          if(result) resolve(result)
          else reject(error)
        }
      )

      streamifier
      .createReadStream(file.buffer)
      .pipe(stream)

    })

    nuevas.push(resultado.secure_url)
  }

}

// 🔥 combinar
banner.imagenes = [
  ...imagenesActuales,
  ...nuevas
]

await banner.save()

res.send("banner guardado")

}catch(e){

console.log("ERROR BANNER:",e)
res.status(500).send("error")

}
})

app.get("/banner", async (req,res)=>{
let banner = await Banner.findOne()
res.json(banner || {imagenes:[]})
})

// ================= EXTRAS =================

app.get("/extras", async(req,res)=>{

let extras = await Extras.findOne()

if(!extras){

extras = await Extras.create({
imagenes:[]
})

}

res.json(extras)

})

app.get("/categorias", async(req,res)=>{

let categorias = await Categorias.findOne()

if(!categorias){

categorias = await Categorias.create({
estimulantes:"",
lubricantes:"",
juguetes:"",
lenceria:"",
cuidado_intimo:"",
juegos_eroticos:"",
todo:""
})

}

res.json(categorias)

})

app.post(
"/categorias",
upload.single("imagen"),
async(req,res)=>{
try{

let categorias =
await Categorias.findOne()

if(!categorias){

categorias =
await Categorias.create({})
}

let nombre =
req.body.nombre

if(!nombre){
return res.status(400)
.send("Categoría requerida")
}

let url = ""

if(req.file){

let result =
await new Promise(
(resolve,reject)=>{

const stream =
cloudinary.uploader.upload_stream(

{
folder:
"sensify/categorias"
},

(error,result)=>{

if(result)
resolve(result)
else
reject(error)

}

)

streamifier
.createReadStream(
req.file.buffer
)
.pipe(stream)

})

url = result.secure_url

}

categorias[nombre] = url

await categorias.save()

res.json({
ok:true,
url
})

}catch(e){

console.log(e)

res.status(500)
.send("error")

}
})

app.delete("/categorias/:nombre", async(req,res)=>{

try{

let categorias =
await Categorias.findOne()

if(!categorias){
return res.json({ok:true})
}

categorias[
req.params.nombre
] = ""

await categorias.save()

res.json({ok:true})

}catch(e){

console.log(e)

res.status(500)
.send("error")

}

})

app.post("/extras", upload.array("imagenes"), async(req,res)=>{

try{

let extras = await Extras.findOne()

if(!extras){

extras = await Extras.create({
imagenes:[]
})

}

let actuales =
JSON.parse(req.body.imagenesActuales || "[]")

let nuevas = []

if(req.files){

for(let file of req.files){

let result = await new Promise((resolve,reject)=>{

const stream = cloudinary.uploader.upload_stream(

{ folder:"sensify/extras" },

(error,result)=>{

if(result) resolve(result)
else reject(error)

}

)

streamifier
.createReadStream(file.buffer)
.pipe(stream)

})

nuevas.push(result.secure_url)

}

}

extras.imagenes = [
...actuales,
...nuevas
]

await extras.save()

res.send("ok")

}catch(e){

console.log(e)

res.status(500).send("error")

}

})

app.get("/carrito/:usuario", async (req,res)=>{
let carrito = await Carrito.findOne({usuario:req.params.usuario})
if(!carrito) return res.json({productos:[]})
res.json(carrito)
})

app.post("/eliminar-foto", async (req,res)=>{
try{

let usuario = await Usuario.findOne({ correo: req.body.correo })

if(!usuario || !usuario.foto_id){
return res.json({ok:false})
}

// 🔥 eliminar de cloudinary
await cloudinary.uploader.destroy(usuario.foto_id)

// limpiar usuario
usuario.foto = null
usuario.foto_id = null

await usuario.save()

res.json({ok:true})

}catch(e){
console.log(e)
res.json({ok:false})
}
})

app.post("/carrito/eliminar", async (req,res)=>{

let carrito = await Carrito.findOne({usuario:req.body.usuario})

carrito.productos = carrito.productos.filter(p=>p.productoId !== req.body.productoId)

await carrito.save()

res.send("ok")
})

app.post("/colores", async (req,res)=>{

let existe = await Colores.findOne()

if(existe){
  Object.assign(existe, req.body)
  await existe.save()
}else{
  let nuevo = new Colores(req.body)
  await nuevo.save()
}

res.send("colores guardados")
})

app.get("/colores", async (req,res)=>{

let colores = await Colores.findOne()

res.json(colores || {
  principal:"#1b0b2e",
  secundario:"#ff4fd8",
  acento:"#ff8be3",
  texto:"#ffffff",
  card:"#1a1a24"
})

})


// REGISTRO
app.post("/registro", async (req,res)=>{
try{

let nuevoUsuario = new Usuario({
  nombre: req.body.nombre,
  apellido: req.body.apellido,
  correo: req.body.correo,
  password: req.body.password,
  rol: "usuario",
  anonimo: true
})

await nuevoUsuario.save()

res.json({mensaje:"usuario creado"})

}catch(err){
console.log("ERROR REGISTRO:", err)
res.status(500).json({mensaje:"error"})
}
})


// LOGIN 
app.post("/login", async (req,res)=>{

let usuario = await Usuario.findOne({
  
correo:req.body.correo,
password:req.body.password
})

if(!usuario){
return res.json({mensaje:"error"})
}

res.json({
mensaje:"login correcto",
usuario: usuario
})

})

// actualizar 
app.post("/actualizar-usuario", async (req,res)=>{

try{

let { viejoCorreo, nombre, apellido, correo, password } = req.body

// 🔥 validar duplicado
let existe = await Usuario.findOne({ correo })

if(existe && correo !== viejoCorreo){
  return res.json({ok:false, mensaje:"Correo ya en uso"})
}

// 🔥 buscar usuario original
let usuario = await Usuario.findOne({ correo: viejoCorreo })

if(!usuario){
  return res.json({ok:false})
}

// 🔥 actualizar
usuario.nombre = nombre
usuario.apellido = apellido
usuario.correo = correo
usuario.password = password

await usuario.save()

res.json({ok:true})

}catch(e){
console.log(e)
res.json({ok:false})
}

})

// foto perfil
app.post("/subir-foto", upload.single("foto"), async (req,res)=>{
try{

if(!req.file){
return res.status(400).send("No hay archivo")
}

let resultado = await new Promise((resolve, reject)=>{
const stream = cloudinary.uploader.upload_stream(
  { folder: "sensify/perfiles" },
  (error, result)=>{
    if(result) resolve(result)
    else reject(error)
  }
)

streamifier.createReadStream(req.file.buffer).pipe(stream)
})

// 🔥 guardar en usuario
let usuario = await Usuario.findOne({ correo: req.body.correo })

if(!usuario){
return res.status(404).send("Usuario no encontrado")
}

usuario.foto = resultado.secure_url
usuario.foto_id = resultado.public_id
await usuario.save()

res.json({ ok:true, foto: resultado.secure_url })

}catch(e){
console.log(e)
res.status(500).send("error")
}
})

// CREAR PRODUCTO
app.post("/productos", verificarAdmin, upload.array("imagenes",6), async (req,res)=>{
  console.log("FILES:", req.files)
console.log("BODY:", req.body)
try{

if(!req.files || req.files.length === 0){
return res.status(400).send("imagen requerida")
}

let imagenes = [];

for (let file of req.files) {

  let resultado = await new Promise((resolve, reject)=>{
    const stream = cloudinary.uploader.upload_stream(
      { folder: "sensify" },
      (error, result)=>{
        if(result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });

  imagenes.push(resultado.secure_url);
}


let nuevo = new Producto({
nombre: req.body.nombre,
precio: Number(req.body.precio),
descripcion: req.body.descripcion,

descripcionLarga: req.body.descripcionLarga,
info: req.body.info,
caracteristicas: req.body.caracteristicas,
modoUso: req.body.modoUso,
recomendaciones: req.body.recomendaciones,

imagenes: imagenes,
categoria: (req.body.categoria || "").trim().toLowerCase(),
tallas:JSON.parse(req.body.tallas || "[]"),
stock: Number(req.body.stock),

// 🔥 PROMO
promo: req.body.promo === "true" || req.body.promo === true,
descuento: Number(req.body.descuento) || 0,
precioPromo: Number(req.body.precioPromo) || 0
})
await nuevo.save()

res.send("producto creado")

}catch(e){
console.log(e)
res.status(500).send("Campos invalidos")
}
})

//Carrusel
app.get("/carrusel", async (req,res)=>{
try{

let data = await Carrusel.findOne()

if(!data || !data.productos.length){
return res.json([])
}

let productos = await Producto.find({
_id:{ $in:data.productos }
})

productos = productos.map(p=>{

let obj = p.toObject()

obj.agotado = p.stock === 0

return obj

})

res.json(productos)

}catch(e){

console.log("ERROR CARRUSEL:",e)
res.status(500).json([])

}
})

app.post("/carrusel", verificarAdmin, async (req,res)=>{
  try{

    let ids = req.body.productos

    let existente = await Carrusel.findOne()

    if(existente){
      existente.productos = ids
      await existente.save()
    }else{
      let nuevo = new Carrusel({ productos: ids })
      await nuevo.save()
    }

    res.send("ok")

  }catch(e){
    console.log("ERROR GUARDAR CARRUSEL:", e)
    res.status(500).send("error")
  }
})

//CREAR PEDIDOS
app.get("/lugares-pedido", verificarAdmin, async (req,res)=>{
let lugares = await LugarPedido.find()
res.json(lugares)
})

app.post("/lugares-pedido", verificarAdmin, async (req,res)=>{

try{

let nombre = (req.body.nombre || "").trim()

if(!nombre){
return res.status(400).json({
error:"Nombre requerido"
})
}

let existe = await LugarPedido.findOne({
nombre: new RegExp("^" + nombre + "$","i")
})

if(existe){
return res.json(existe)
}

let nuevo = new LugarPedido({
nombre
})

await nuevo.save()

res.json(nuevo)

}catch(e){

console.log(e)

res.status(500).json({
error:"error"
})

}

})

// PROVEEDORES

app.get("/proveedores", async(req,res)=>{

let proveedores = await Proveedor.find()

res.json(proveedores)

})

app.post("/proveedores", async(req,res)=>{

try{

let nombre = (req.body.nombre || "").trim()

if(!nombre){

return res.status(400).json({
error:"nombre requerido"
})

}

let existe = await Proveedor.findOne({
nombre: new RegExp("^" + nombre + "$","i")
})

if(existe){
return res.json(existe)
}

let nuevo = new Proveedor({
nombre
})

await nuevo.save()

res.json(nuevo)

}catch(e){

console.log(e)

res.status(500).json({
error:"error"
})

}

})

// OBTENER PRODUCTOS
app.get("/productos", async (req,res)=>{
let productos = await Producto.find()
productos = productos.map(p => {
  let obj = p.toObject()
  obj.agotado = p.stock === 0
  return obj
})
res.json(productos)
})


// COMPRAR
app.post("/comprar/:id", async (req,res)=>{

let producto = await Producto.findById(req.params.id)
if(!producto) return res.send("no existe")

// 🔥 SOLO descuenta si hay stock
if(producto.stock > 0){
  producto.stock -= 1
  await producto.save()
}

// 🔥 SIEMPRE responde ok (aunque esté agotado)
res.json({
  ok: true,
  stock: producto.stock
})

})


// PEDIDOS
app.get("/pedidos", verificarAdmin, async (req,res)=>{

let pedidos = await Pedido.find()
res.json(pedidos)
})

app.get("/mis-pedidos/:correo", async (req,res)=>{

try{

let correo = req.params.correo
.trim()
.toLowerCase()

let pedidos = await Pedido.find()

pedidos = pedidos.filter(p => {

if(!p.usuario) return false

return p.usuario.trim().toLowerCase() === correo

})

res.json(pedidos)

}catch(e){

console.log(e)

res.status(500).json([])

}

})

app.put("/pedido/recibido/:id", async (req,res)=>{

try{

let pedido = await Pedido.findById(req.params.id)

if(!pedido){
return res.status(404).send("no existe")
}

pedido.estado = "entregado"

await pedido.save()

res.json({
ok:true
})

}catch(e){

console.log(e)

res.status(500).json({
ok:false
})

}

})

//ADMIN
function verificarAdmin(req,res,next){

let correo = req.headers["x-admin-email"]

if(!correo){
return res.status(401).json({
error:"No autorizado"
})
}

Usuario.findOne({
correo: correo,
rol: "admin"
})
.then(usuario=>{

if(!usuario){
return res.status(403).json({
error:"Acceso denegado"
})
}
next()

})
.catch(e=>{
console.log(e)
res.status(500).json({
error:"Error servidor"
})
})

}

// CAMBIAR ESTADO

async function enviarPedido(id){

  let res = await fetch("http://localhost:3000/pedido/" + id,{
    method:"PUT",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ estado: "enviado" })
  })

  let data = await res.text()
  console.log("RESPUESTA:", data)

  if(res.ok){
    alert("Pedido enviado 🚚")
    mostrarPedidos()
  }else{
    alert("No se pudo actualizar")
  }
}

// BORRAR VENTAS
app.delete("/pedido/:id", verificarAdmin, async (req,res)=>{
try{

console.log("Eliminar pedido:", req.params.id)

await Pedido.findByIdAndDelete(req.params.id)

res.json({mensaje:"ok"})

}catch(e){
console.log("ERROR:", e)
res.status(500).json({error:"error eliminando"})
}
})

// INVENTARIO
app.get("/inventario", verificarAdmin, async (req,res)=>{

let productos = await Producto.find()
let pedidos = await Pedido.find()

let inventario = productos.map(p=>{

let vendidos = 0

pedidos.forEach(pedido => {

if(pedido.estado === "enviado" && pedido.productos){

pedido.productos.forEach(prod => {

if(prod.nombre === p.nombre){
vendidos += prod.cantidad
}

})

}

})

return {
nombre:p.nombre,
stock:p.stock,
vendidos:vendidos,
precioFinal:
p.promo === true
? p.precioPromo
: p.precio
}

})

res.json(inventario)
})


// ESTADISTICAS
app.get("/estadisticas", verificarAdmin, async (req,res)=>{

let productos = await Producto.find()
let pedidos = await Pedido.find()

let {desde, hasta} = req.query

if(desde && hasta){

let f1 = new Date(desde)
let f2 = new Date(hasta)

pedidos = pedidos.filter(p=>{
let fecha = new Date(p.fecha)
return fecha >= f1 && fecha <= f2
})

}

let usuarios = await Usuario.find()

let pendientes = pedidos.filter(p=>p.estado==="pendiente").length
let enviados = pedidos.filter(p=>p.estado==="enviado").length

let ventas = {}

pedidos.forEach(p => {

  // 🔥 solo contar pedidos enviados (opcional pero recomendado)
  if(p.estado !== "enviado") return

  if(p.productos && p.productos.length){

    p.productos.forEach(prod => {
      ventas[prod.nombre] = (ventas[prod.nombre] || 0) + prod.cantidad
    })

  }

})

let masVendido="Ninguno"
let max=0

for(let p in ventas){
if(ventas[p]>max){
max=ventas[p]
masVendido=p
}
}


let valorInventario = productos.reduce((t,p)=>{
return t + (p.precio*p.stock)
},0)

let stockCritico = productos.filter(p => p.stock <= 3).length

res.json({
productos: productos.length,
usuarios: usuarios.length,
pendientes,
enviados,
masVendido,
stockCritico,

listaProductos: productos.map(p=>p.nombre),
listaUsuarios: usuarios.map(u=>u.correo),
listaPendientes: pedidos.filter(p=>p.estado==="pendiente").map(p=>p.numero),
listaEnviados: pedidos.filter(p=>p.estado==="enviado").map(p=>p.numero)
})

})

app.get("/usuarios", verificarAdmin, async (req,res)=>{
let usuarios = await Usuario.find()
res.json(usuarios)
})

app.delete("/productos/:id", verificarAdmin, async (req,res)=>{

let producto = await Producto.findById(req.params.id)

if(producto && producto.imagenes){

for(let img of producto.imagenes){

let public_id = img.split("/").pop().split(".")[0]

await cloudinary.uploader.destroy("sensify/" + public_id)

}

}

await Producto.findByIdAndDelete(req.params.id)

res.send("Producto eliminado")

})

app.post("/carrito/agregar", async (req,res)=>{

let {usuario, producto} = req.body
let carrito = await Carrito.findOne({usuario})

if(!carrito){
carrito = new Carrito({
usuario,
productos:[]
})
}

let existe = carrito.productos.find(p=>p.productoId === producto.productoId)

if(existe){
existe.cantidad += producto.cantidad

// 🔥 actualizar por si cambió promo
existe.precio = producto.precio
existe.precioOriginal = producto.precioOriginal
existe.descuento = producto.descuento
existe.promo = producto.promo

}else{
let productoDB = await Producto.findById(producto.productoId)

producto.agotado = productoDB ? productoDB.stock === 0 : false

carrito.productos.push(producto)
}

await carrito.save()

res.send("ok")
})

app.post("/carrito/actualizar", async (req,res)=>{

let carrito = await Carrito.findOne({usuario:req.body.usuario})

if(carrito){
carrito.productos = req.body.productos
await carrito.save()
}

res.send("ok")
})


app.post("/pedido-temporal", async (req,res)=>{

try{

await PedidoTemporal.create(req.body)

res.json({
ok:true
})

}catch(e){

console.log(e)

res.status(500).json({
ok:false
})

}

})

app.post("/crear-pedido-manual", verificarAdmin, async (req,res)=>{

try{

let {
productos,
fecha,
lugar
} = req.body

if(!productos || productos.length === 0){
return res.status(400).json({
error:"productos requeridos"
})
}

/* CONTADOR */

let contador =
await Contador.findOneAndUpdate(

{ nombre:"pedidos" },

{ $inc:{ valor:1 } },

{ new:true, upsert:true }

)

if(contador.valor < 1500){
contador.valor = 1500
}

if(contador.valor > 9999){
contador.valor = 1500
}

await contador.save()

/* TOTAL */

let total = 0

/* ARMAR PRODUCTOS */

let productosFinales = []

for(let item of productos){

let productoDB = await Producto.findById(item.productoId)

if(!productoDB) continue

let cantidad = Number(item.cantidad) || 1

/* DESCONTAR STOCK */

productoDB.stock = Math.max(
0,
productoDB.stock - cantidad
)

await productoDB.save()

/* PRECIO */

let precioFinal = productoDB.promo
? productoDB.precioPromo
: productoDB.precio

total += precioFinal * cantidad
productosFinales.push({
productoId: productoDB._id,
nombre: productoDB.nombre,
precio: precioFinal,
cantidad,
imagen: productoDB.imagenes?.[0] || ""
})
}

/* CREAR PEDIDO */

let pedido = await Pedido.create({
numero: contador.valor,
usuario:"admin",
referencia:"MANUAL-" + Date.now(),
productos: productosFinales,
lugar:"Página web",
total,
fecha: fecha
? new Date(fecha + "T12:00:00")
: new Date(),
estado:"enviado",
lugar: lugar || "Manual"

})

res.json({
ok:true,
pedido
})

}catch(e){

console.log("ERROR PEDIDO MANUAL:",e)
res.status(500).json({
ok:false
})
}

})

app.post("/crear-firma", async (req,res)=>{

try{

let { referencia, total } = req.body

let amountInCents = Math.round(total * 100)

let cadena = 
referencia +
amountInCents +
"COP" +
process.env.WOMPI_INTEGRITY_SECRET

let firma = crypto
.createHash("sha256")
.update(cadena)
.digest("hex")

res.json({
firma
})

}catch(e){

console.log(e)

res.status(500).json({
error:"Error creando firma"
})

}

})

app.post("/webhook/wompi", async (req,res)=>{

try{

let evento = JSON.parse(req.body.toString())

console.log(
"WEBHOOK WOMPI:",
JSON.stringify(evento,null,2)
)

/* SOLO EVENTOS DE TRANSACCIÓN */

if(evento.event !== "transaction.updated"){
return res.sendStatus(200)
}

let transaccion = evento.data.transaction

/* SOLO APROBADOS */

if(transaccion.status !== "APPROVED"){
return res.sendStatus(200)
}

let referencia = transaccion.reference

/* EVITAR DUPLICADOS */

let existe = await Pedido.findOne({
referencia
})

if(existe){
return res.sendStatus(200)
}

/* BUSCAR PEDIDO TEMPORAL */

let pedidoTemporal =
await PedidoTemporal.findOne({
referencia
})

if(!pedidoTemporal){

console.log(
"No existe pedido temporal"
)

return res.sendStatus(200)

}

/* CONTADOR */

let contador =
await Contador.findOneAndUpdate(

{ nombre:"pedidos" },

{ $inc:{ valor:1 } },

{ new:true, upsert:true }

)

if(contador.valor < 1500){
contador.valor = 1500
}

if(contador.valor > 9999){
contador.valor = 1500
}

await contador.save()

/* DESCONTAR STOCK */

for(let prod of pedidoTemporal.productos){

let productoDB = await Producto.findOne({
nombre: prod.nombre
})

if(productoDB){

productoDB.stock = Math.max(
0,
productoDB.stock - prod.cantidad
)

await productoDB.save()

}

}

/* CREAR PEDIDO REAL */

await Pedido.create({

numero: contador.valor,

referencia: referencia,

usuario: pedidoTemporal.usuario,

productos: pedidoTemporal.productos,

total: pedidoTemporal.total,

fecha: new Date(),

estado:"pendiente",

datosEnvio: pedidoTemporal.datosEnvio

})

/* VACIAR CARRITO */

await Carrito.deleteOne({
usuario: pedidoTemporal.usuario
})

/* ELIMINAR TEMPORAL */

await PedidoTemporal.deleteOne({
referencia
})

console.log(
"Pedido creado correctamente"
)

res.sendStatus(200)

}catch(e){

console.log(
"ERROR WEBHOOK:",
e
)

res.sendStatus(500)

}

})

// ================= COMPRAS =================

// OBTENER COMPRAS
app.get("/compras", verificarAdmin, async (req,res)=>{

try{

let compras = await Compra.find()
.sort({ fecha:-1 })

res.json(compras)

}catch(e){

console.log(e)

res.status(500).json([])

}

})

// REINICIAR COMPRAS
app.delete("/reiniciar-compras", async(req,res)=>{

try{

await Compra.deleteMany({})

res.json({
ok:true
})

}catch(e){

console.log(e)

res.status(500).json({
ok:false
})

}

})

// REINICIAR VENDIDOS INVENTARIO
app.delete("/reiniciar-inventario", verificarAdmin, async (req,res)=>{

try{

let pedidos = await Pedido.find()

for(let pedido of pedidos){

pedido.estado = "reiniciado"

await pedido.save()

}

res.json({
ok:true
})

}catch(e){

console.log(e)

res.status(500).json({
ok:false
})

}

})

// EXCEL COMPRAS

app.get("/excel-compras", verificarAdmin, async(req,res)=>{

try{
let compras = await Compra.find()
const workbook = new ExcelJS.Workbook()
const sheet =
workbook.addWorksheet("Compras")

sheet.columns = [

{
header:"Producto",
key:"producto",
width:35
},

{
header:"Cantidad",
key:"cantidad",
width:15
},

{
header:"Precio compra",
key:"precioCompra",
width:20
},

{
header:"Total",
key:"total",
width:20
},

{
header:"Proveedor",
key:"proveedor",
width:25
},

{
header:"Fecha",
key:"fecha",
width:25
}

]

let resumen = {}
compras.forEach(c=>{

if(!resumen[c.producto]){
resumen[c.producto] = {
producto:c.producto,
cantidad:0,
total:0,
proveedor:c.proveedor
}
}
resumen[c.producto].cantidad += c.cantidad
resumen[c.producto].total += c.total
})

Object.values(resumen).forEach(c=>{

sheet.addRow({

producto:c.producto,

cantidad:c.cantidad,

precioCompra:c.total / c.cantidad,

total:c.total,

proveedor:c.proveedor,

fecha:"Resumen"

})

})

res.setHeader(
"Content-Type",
"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)

res.setHeader(
"Content-Disposition",
"attachment; filename=compras.xlsx"
)

await workbook.xlsx.write(res)

res.end()

}catch(e){

console.log(e)

res.status(500).send("error")

}

})

// FRONTEND
app.use(express.static(path.join(__dirname,"../frontend")))