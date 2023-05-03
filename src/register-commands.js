require('dotenv').config();
const {REST, Routes, ApplicationCommandOptionType, PermissionFlagsBits, Client, Interaction} = require('discord.js');

// Commands array
const commands = [
    {
        name: 'whitelist',
        description: 'Whitelists the selected user. Use: /whitelist [username]', 
        options: [
            {
                name: 'minecraft-username',
                description: 'Minecraft username of the person you want to whitelist',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'discord-nickname',
                description: 'Discord nickname of the person you want to whitelist',
                type: ApplicationCommandOptionType.Mentionable,
                required: false,
            }
        ],
    },
    {
        name: 'help',
        description: 'Help with using the /whitelist command', 
    },
];

const rest = new REST({version: '10'}).setToken(process.env.TOKEN);

// Registers commands
(async () => {
    try {
        console.log('Registering commands...');

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID            // Needs to be updated to current server
            ),
            {body: commands}
        );

        console.log('Commands registered');
    } catch (error) {
        console.log(`An error occured: ${error}`);
    }
})();