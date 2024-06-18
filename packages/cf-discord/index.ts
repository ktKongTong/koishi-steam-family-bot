import { REST, Routes } from 'discord.js'

const TOKEN = ''
const CLIENT_ID = ''

async function main() {
  const commands = [
    {
      name: 'ping',
      description: 'Replies with Pong!',
    },
  ]

  const rest = new REST({ version: '10' }).setToken(TOKEN)

  try {
    console.log('Started refreshing application (/) commands.')

    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })

    console.log('Successfully reloaded application (/) commands.')
  } catch (error) {
    console.error(error)
  }
}

main()
