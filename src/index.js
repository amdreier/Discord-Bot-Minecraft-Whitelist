require('dotenv').config();
const {Client, IntentsBitField, Message} = require("discord.js");
const {Rcon} = require("rcon-client");

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});


/////////////////////////
/*** Event Listeners ***/
/////////////////////////

// Ready //
client.on('ready', (c) => {
    console.log(`${c.user.username} is ready.`);
});

/*
// New Message
client.on('messageCreate', (msg) => {
    console.log(msg.content);
    console.log(msg.author.username);
    if  (msg.content === 'hi') {
        msg.reply(`Hello, ${msg.author.username}`);
    }
});
*/

// Handle Commands
client.on('interactionCreate', (interaction) => {
    if (!interaction.isChatInputCommand()) return; // Only continue if interaction is command

    // /whitelist [minecraft-username] [optional: discord-nickname]
    if (interaction.commandName === 'whitelist') {
        try {
            (async () => {
                console.log(`${interaction.member.user.tag} whitelist add Minecraft: ${interaction.options.get('minecraft-username').value}`);

                // check for interaction in the correct channel
                const channel = await client.channels.cache.get('1103163793284010024'); // Needs to be changed to server whitelist channel

                if (!channel) {
                    interaction.reply({content: 'Channel does not exist!', ephemeral: true});
                    return;
                }
                                                // Needs to be changed to server whitelist channel
                if (!(interaction.channelId === '1103163793284010024')) {
                    interaction.reply({content: 'You don\'t have access to that here.', ephemeral: true});
                    return;
                };

                await interaction.deferReply();

                // handle roles
                const targetUserId = interaction.options.get('discord-nickname')?.value || false;
                if (!targetUserId) {
                    console.log('(and no Discord user)');
                    await interaction.editReply("That user doesn't exist in this discord channel or you didn't include their Discord nickname. If the user does exist, make sure to do /whitelist with their Discord nickname included!");
                } else {
                    const targetUser = await interaction.guild.members.fetch(targetUserId);
                    
                    if (!targetUser) {
                        console.log('(and no Discord user)');
                        await interaction.editReply("That user doesn't exist in this discord channel or you didn't include their Discord nickname. If the user does exist, make sure to do /whitelist with their Discord nickname included!");
                    } else {
                        console.log(`(and Discord: ${targetUser.user.tag})`);

                        const role = interaction.guild.roles.cache.get(process.env.WHITELIST_ROLE_ID);
                        
                        if (!role) {
                            await interaction.editReply(`Error adding \"Whitelisted\" role to @${targetUser.user.username}`);
                        } else if (!targetUser.roles.cache.has(role.id)) {
                            await targetUser.roles.add(role);
                            await interaction.editReply(`\"Whitelisted\" role added to @${targetUser.user.username}`);
                        } else {
                            await interaction.editReply(`@${targetUser.user.username} already has the \"Whitelisted\" role`);
                        }
                    }
                }
                
                // handel RCON
                const rcon = await Rcon.connect({
                    host: "romaetplus.amdreier.com", port: 2570, password: process.env.RCON_PSWD
                });

                await rcon.send(`say From Whitelist-bot: ${interaction.member.user.username} added ${interaction.options.get('minecraft-username').value} to the Whitelist`);
    
                let response = await rcon.send(`whitelist add ${interaction.options.get('minecraft-username').value}`);
                 
                await interaction.followUp(`Server response: ${response}`);
                 
                rcon.end();
            })();
        } catch (error) {
            console.log(`Error whitelisting: ${error}`);
        }
    }

    // /help
    if (interaction.commandName === 'help') {
        interaction.reply(
                {
                content: 'Useage: /whitelist [Minecraft Username] [Optional: Discord nickname] (without the [])\nDescription: Whitelists the selected Minecraft username on the server. If a Discord nickname on the server is provided, it will add the \"Whitelisted\" role to that user.\nRequirements:\n\t- The command issuer MUST have the \"Trusted\" role.\n- The command must be issued in the \"whitelisting\" channel.\n- If the person being whitelisted is on the Discord server, include that in the command (although this is not required).\n\nAdditional info: Be careful who you whitelist! You are responsible for them, and any punishment they receive, for a while, will be applied to you too (within reason)!',
                ephemeral: true
                }
            );
    }
});

client.login(process.env.TOKEN);
