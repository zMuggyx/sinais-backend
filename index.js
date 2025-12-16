const { Telegraf } = require('telegraf')
const express = require('express')
const WebSocket = require('ws')
const cors = require('cors')

const BOT_TOKEN = process.env.BOT_TOKEN


const bot = new Telegraf(BOT_TOKEN)
const app = express()

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'SignalNinja API',
    websocket: 'wss://api.tr4derninja.com',
    timestamp: new Date().toISOString()
  })
})


app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
  console.log(`✅ Backend rodando na porta ${PORT}`)
})



const wss = new WebSocket.Server({ server })

function extrairSinal(texto) {
  if (!texto) return null
  if (!texto.includes('Entrada Confirmada')) return null

  return {
    ativo: texto.match(/Ativo:\s*(.*)/)?.[1] || '',
    tempo: texto.match(/Tempo Gráfico:\s*(.*)/)?.[1] || '',
    estrategia: texto.match(/Estratégia Aplicada:\s*(.*)/)?.[1] || '',
    horario: texto.match(/Horário:\s*(.*)/)?.[1] || '',
    recebido_em: new Date().toISOString()
  }
}

bot.on('channel_post', (ctx) => {
  const texto = ctx.channelPost.text
  const sinal = extrairSinal(texto)

  if (!sinal) return

  console.log('📡 Sinal capturado:', sinal)

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(sinal))
    }
  })
})

bot.launch()
