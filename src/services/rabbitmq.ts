import amqplib from 'amqplib'

let channel: amqplib.Channel

export async function initRabbitMQ() {
  const connection = await amqplib.connect('amqp://guest:guest@localhost:5672')
  channel = await connection.createChannel()
  await channel.assertQueue('user.registered', { durable: true })
}

export function publishToQueue(queue: string, message: any) {
  if (!channel) {
    throw new Error('Canal RabbitMQ não iniciado.')
  }
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true
  })
}
