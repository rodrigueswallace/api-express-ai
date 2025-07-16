import express from 'express'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import chatRoutes from './routes/chat'
import { initRabbitMQ } from './services/rabbitmq'


async function main() {
  await initRabbitMQ() // inicializa o RabbitMQ e cria o canal
dotenv.config()

const app = express()
app.use(express.json())

app.use('/auth', authRoutes)

app.use('/chat', chatRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

}

main().catch(err => {
  console.error('Erro na inicialização do servidor:', err)
  process.exit(1)
})
