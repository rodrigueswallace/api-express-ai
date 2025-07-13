import { Request, Response } from 'express'
import { generateLlamaResponse } from '../services/llama'
import { nhost } from '../services/nhost'
import { GraphQLClient, gql } from 'graphql-request'

export async function sendMessage(req: Request, res: Response) {
  const { chat_id, user_message } = req.body

  try {
    console.log('[REQ]', req.body)

    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não enviado no header.' })
    }

    const token = authHeader.split(' ')[1] // Bearer <token>
    console.log('[TOKEN]', token)

    const gqlClient = new GraphQLClient(nhost.graphql.url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const insertMessageMutation = gql`
      mutation InsertMessage($chat_id: Int!, $is_user: Boolean!, $msg_context: String! ) {
        insert_syschat_msg_one(object: {
          chat_id: $chat_id,
          is_user: $is_user,
          msg_context: $msg_context
        }) {
          msg_id
        }
      }
    `


    // Insere a mensagem do usuário
    console.log('[INSERINDO MENSAGEM USUÁRIO]')
    await gqlClient.request(insertMessageMutation, {
      chat_id,
      is_user: true,
      msg_context: user_message
      
    })

    // Gera a resposta da IA
    console.log('[GERANDO RESPOSTA DA IA]')
    const aiResponse = await generateLlamaResponse(user_message)
    console.log('[IA]', aiResponse)

    // Insere a mensagem da IA
    console.log('[INSERINDO MENSAGEM IA]')
    await gqlClient.request(insertMessageMutation, {
      chat_id,
      msg_context: aiResponse,
      is_user: false
    })

    res.json({ success: true, aiResponse })
  } catch (error) {
    console.error('[ERRO NO CHAT]:', error)
    res.status(500).json({ error: String(error) })
  }
}
