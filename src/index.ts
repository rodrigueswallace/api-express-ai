import express from 'express'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import chatRoutes from './routes/chat'

dotenv.config()

const app = express()
app.use(express.json())

app.use('/auth', authRoutes)

app.use('/chat', chatRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
