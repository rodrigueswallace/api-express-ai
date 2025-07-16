import { Request, Response } from 'express'
import { nhost } from '../services/nhost'
import { GraphQLClient, gql } from 'graphql-request'
import { publishToQueue } from '../services/rabbitmq'

export async function register(req: Request, res: Response) {
  const { email, password } = req.body

  try {
    const result = await nhost.auth.signUp({ email, password })

    if (result.error) {
      return res.status(400).json({ error: result.error.message })
    }

    const user = nhost.auth.getUser()
    
    if (user) {
      publishToQueue('user.registered', {
        userId: user.id,
        email: user.email
      })
    }

    return res.status(201).json({
      session: result.session,
      user
    })
  } catch (err) {
    console.log(err)
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




    
    const token = result.session?.accessToken

    // Se tivermos token e user.id, registra o login
    if (token && user?.id) {
      const gqlClient = new GraphQLClient(nhost.graphql.url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const insertLoginLog = gql`
        mutation InsertLoginLog($user_id: uuid!) {
          insert_syschat_login_log_one(object: { user_id: $user_id }) {
            ll_id
          }
        }
      `

      await gqlClient.request(insertLoginLog, {
        user_id: user.id
      })
    }





    return res.status(200).json({
      session: result.session,
      user
    })
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao fazer login' })
  }
}
