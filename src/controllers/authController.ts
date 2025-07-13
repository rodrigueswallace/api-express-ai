import { Request, Response } from 'express'
import { nhost } from '../services/nhost'

export async function register(req: Request, res: Response) {
  const { email, password } = req.body

  try {
    const result = await nhost.auth.signUp({ email, password })

    if (result.error) {
      return res.status(400).json({ error: result.error.message })
    }

    const user = nhost.auth.getUser()

    return res.status(201).json({
      session: result.session,
      user
    })
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao cadastrar usuário' })
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body

  try {
    const result = await nhost.auth.signIn({ email, password })

    if (result.error) {
      return res.status(400).json({ error: result.error.message })
    }

    const user = nhost.auth.getUser()

    return res.status(200).json({
      session: result.session,
      user
    })
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao fazer login' })
  }
}
