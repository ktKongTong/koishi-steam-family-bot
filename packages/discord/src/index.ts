import { REST, Routes, Client, Events, GatewayIntentBits } from 'discord.js'
import { Config, steamCommands, Command } from 'steam-family-bot-core'
import { DiscordSession } from './session'
import { SteamService } from './service'
import { NoOpRender } from '@/noop-render'
import { ChannelInfo } from '@/db'

const token = process.env.DISCORD_TOKEN
const CLIENT_ID = process.env.CLIENT_ID

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] })

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`)
  })

  await client.login(token)
  const cmds = new Map<string, Command<ChannelInfo>>()
  const allCommands = steamCommands<ChannelInfo>()
  for (const item of allCommands) {
    cmds.set(item.name.split('.')[1], item)
  }
  const commands = [
    {
      name: 'ping',
      description: 'Replies with Pong!',
    },
  ].concat(
    allCommands.map((cmd) => ({
      name: cmd.name.split('.')[1],
      description: cmd.description,
      options: [
        {
          name: 'input',
          description: 'input',
          type: 3,
        },
      ],
    }))
  )

  const rest = new REST({ version: '10' }).setToken(token)
  try {
    console.log('Started refreshing application (/) commands.')
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
    console.log('Successfully reloaded application (/) commands.')
  } catch (error) {
    console.error(error)
  }
  const config = {
    SteamHelperAPIHost: 'https://steam-family-lib-viewer.ktlab.io',
    libMonitorCron: '',
    libInfoSyncerCron: '',
    steamDataFetchMode: 'remote',
  } satisfies Config
  const render = new NoOpRender()
  const steamService = new SteamService<ChannelInfo>(config)
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return
    await interaction.deferReply({ ephemeral: true })
    const command = interaction.commandName
    // @ts-ignore
    const cmd = cmds.get(command)

    if (!cmd) {
      console.error(`No command matching ${interaction.commandName} was found.`)
      return
    }
    try {
      // @ts-ignore
      await cmd.callback(
        render,
        steamService,
        console,
        new DiscordSession(interaction),
        {},
        interaction.options.getString('input'),
        interaction.options.getString('input')
      )
    } catch (error) {
      console.error(error)
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error while executing this command!',
          ephemeral: true,
        })
      } else {
        await interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true,
        })
      }
    }
  })
}

main()
