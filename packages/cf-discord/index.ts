import {
  REST,
  Routes,
  Client,
  Events,
  GatewayIntentBits,
  Collection,
  CommandInteraction,
  Interaction,
  SlashCommandBuilder,
} from 'discord.js'
import {
  APIService,
  Config,
  FamilyGames,
  GameInfo,
  IAPIService,
  IDBService,
  ISteamAccountDAO,
  ISteamFamilyLibSubscribeDAO,
  ISteamFamilySharedLibDAO,
  ISteamService,
  Msg,
  Result,
  Session,
  SteamAccount,
  SteamAccountWithFamilyId,
  steamCommands,
  SteamFamilyLib,
  SubscribeInfo,
} from 'steam-family-bot-core'
import { Command } from 'steam-family-bot-core/lib/cmd/builder'
import { ChannelInfo } from './db'
import { DiscordSession } from './session'
import { SteamService } from './service'
import { ImgRender } from 'steam-family-bot-core/lib/render'

const token = ''
const CLIENT_ID = ''

async function main() {
  // Create a new client instance
  const client = new Client({ intents: [GatewayIntentBits.Guilds] })
  //
  // // When the client is ready, run this code (only once).
  // // The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
  // // It makes some properties non-nullable.
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`)
  })
  //
  // // Log in to Discord with your client's token
  await client.login(token)

  const cmds = new Map<string, Command>()
  for (const item of steamCommands) {
    cmds.set(item.name.split('.')[1], item)
  }
  const commands = [
    {
      name: 'ping',
      description: 'Replies with Pong!',
    },
  ].concat(
    steamCommands.map((cmd) => ({
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
  const steamService = new SteamService(config)
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
        // await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })
      } else {
        // await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
      }
    }
  })
}

class NoOpRender implements ImgRender {
  getFamilyStatisticImg(
    games: FamilyGames,
    onStart?: () => void,
    onError?: () => void
  ): Promise<string> {
    return Promise.resolve('')
  }

  screenshotFamilyStatistic(token: string, onStart?: () => void): Promise<any> {
    return Promise.resolve(undefined)
  }
}

main()
