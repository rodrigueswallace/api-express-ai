import axios from 'axios'

export async function generateLlamaResponse(prompt: string) {
  const response = await axios.post('http://localhost:11434/api/generate', {
    model: 'llama3',
    prompt,
    stream: false
  })

  return response.data.response.toSting
}
