import fs from 'fs'
import path from 'path'

const DB_PATH = './storage/db/tienda.json'

function asegurarDB() {
  const dir = path.dirname(DB_PATH)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      usuarios: {},
      productos: {},
      ventas: []
    }, null, 2))
  }
}

function leerDB() {
  asegurarDB()

  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
  } catch {
    return {
      usuarios: {},
      productos: {},
      ventas: []
    }
  }
}

function guardarDB(db) {
  asegurarDB()
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

function obtenerUsuario(db, id) {
  if (!db.usuarios[id]) {
    db.usuarios[id] = {
      saldo: 0,
      compras: []
    }
  }

  return db.usuarios[id]
}

function formatoPrecio(numero) {
  return Number(numero).toFixed(2)
}

let handler = async (m, { conn, usedPrefix: _p }) => {

  const db = leerDB()
  const id = m.sender

  const usuario = obtenerUsuario(db, id)

  const productos = Object.values(db.productos)

  let texto = `╭━━━〔 🛍️ 𝐀𝐋𝐀𝐍 𝐒𝐓𝐎𝐑𝐄 𝐌𝐗 〕━━━╮

👤 Cliente: ${await conn.getName(id)}
💰 Saldo: $${formatoPrecio(usuario.saldo)}

╰━━━━━━━━━━━━━━━━━━━━╯

🛒 *PRODUCTOS DISPONIBLES*

`

  if (!productos.length) {

    texto += `╭───────────────╮
│ 📦 TIENDA VACÍA │
╰───────────────╯

Actualmente no hay productos disponibles.

💡 Próximamente tendremos productos disponibles.`
    
  } else {

    for (const producto of productos) {

      texto += `╭───────────────╮
│ 📦 *${producto.nombre}*
│
│ 💰 Precio: $${formatoPrecio(producto.precio)}
│ 📦 Stock: ${producto.stock}
│ 🆔 ID: ${producto.id}
╰───────────────╯

`
    }

    texto += `

━━━━━━━━━━━━━━━━━━━━

💡 *Para comprar:*

${_p}comprar ID

Ejemplo:
${_p}comprar netflix

💰 Para consultar tu saldo:
${_p}saldo

📦 Para ver tus compras:
${_p}miscompras
`
  }

  guardarDB(db)

  await conn.sendMessage(m.chat, {
    text: texto
  }, { quoted: m })
}

handler.help = ['tienda']
handler.tags = ['main']
handler.command = ['tienda', 'shop', 'store']

export default handler
