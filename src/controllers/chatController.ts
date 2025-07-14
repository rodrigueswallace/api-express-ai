import { Request, Response } from 'express'
import { generateLlamaResponse } from '../services/llama'
import { nhost } from '../services/nhost'
import { GraphQLClient, gql } from 'graphql-request'
import { jwtDecode } from 'jwt-decode'

type HasuraJWT = {
  'https://hasura.io/jwt/claims': {
    'x-hasura-user-id': string
  }
}

export async function sendMessage(req: Request, res: Response) {
  let { chat_id, chat_name, user_message } = req.body

  if (!user_message) {
    return res.status(400).json({ error: 'A mensagem do usuário é obrigatória.' })
  }

  try {
    console.log('[REQ]', req.body)

    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não enviado no header.' })
    }

    const token = authHeader.split(' ')[1]
    console.log('[TOKEN]', token)

    const decoded = jwtDecode<HasuraJWT>(token)
    const userId = decoded['https://hasura.io/jwt/claims']['x-hasura-user-id']

    const gqlClient = new GraphQLClient(nhost.graphql.url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    // Se não tiver chat_id, cria novo chat
    if (!chat_id) {
      console.log('[CRIANDO NOVO CHAT]')

      const createChatMutation = gql`
        mutation CreateChat($user_id: uuid!, $chat_name: String!) {
          insert_syschat_chat_one(object: {
            user_id: $user_id,
            chat_name: $chat_name
          }) {
            chat_id
          }
        }
      `

      const nomeDoChat = chat_name || 'Novo Chat'

      const response = await gqlClient.request(createChatMutation, {
        user_id: userId,
        chat_name: nomeDoChat
      }) as {
        insert_syschat_chat_one: {
          chat_id: number
        }
      }

      chat_id = response.insert_syschat_chat_one.chat_id
      console.log('[NOVO CHAT CRIADO]', chat_id)
    }

    // Mutation para inserir mensagem
    const insertMessageMutation = gql`
      mutation InsertMessage($chat_id: Int!, $is_user: Boolean!, $msg_context: String!) {
        insert_syschat_msg_one(object: {
          chat_id: $chat_id,
          is_user: $is_user,
          msg_context: $msg_context
        }) {
          msg_id
        }
      }
    `

    // Insere mensagem do usuário
    console.log('[INSERINDO MENSAGEM USUÁRIO]')
    await gqlClient.request(insertMessageMutation, {
      chat_id,
      is_user: true,
      msg_context: user_message
    })

    // Gera resposta da IA
    console.log('[GERANDO RESPOSTA DA IA]')
    const aiResponse = await generateLlamaResponse(user_message)
    console.log('[IA]', aiResponse)

    // Insere mensagem da IA
    console.log('[INSERINDO MENSAGEM IA]')
    await gqlClient.request(insertMessageMutation, {
      chat_id,
      is_user: false,
      msg_context: aiResponse
    })

    // Resposta final
    res.json({
      success: true,
      aiResponse,
      chat_id
    })
  } catch (error) {
    console.error('[ERRO NO CHAT]:', error)
    res.status(500).json({ error: String(error) })
  }
}
