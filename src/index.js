require('dotenv').config();
const {Client, IntentsBitField, Message} = require("discord.js");
const {Rcon} = require("rcon-client");

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
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

    if (interaction.commandName === 'whitelist') {
        try {
            (async () => {
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

                // handel roles
                const targetUserId = interaction.options.get('discord-nickname')?.value || false;
                if (!targetUserId) {
                    await interaction.editReply("That user doesn't exist in this discord channel or you didn't include their Discord nickname. If the user does exist, make to do /whitelist with their Discord nickname included!");
                } else {
                    const targetUser = await interaction.guild.members.fetch(targetUserId);
                    
                    if (!targetUser) {
                        await interaction.editReply("That user doesn't exist in this discord channel or you didn't include their Discord nickname. If the user does exist, make to do /whitelist with their Discord nickname included!");
                    } else {
                        const role = interaction.guild.roles.cache.get('1102474629467095143'); // need to change to server Whitelisted role
                        
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
                    host: "romaetplus.ddns.net", port: 6859, password: process.env.RCON_PSWD
                });

                await rcon.send(`say From Whitelist-bot: ${interaction.member.user.username} added ${interaction.options.get('minecraft-username').value} to the Whitelist`);
    
                let response = await rcon.send(`whitelist add ${interaction.options.get('minecraft-username').value}`);
                 
                interaction.followUp(`Server response: ${response}`);
                 
                rcon.end();
            })();
        } catch (error) {
            console.log(`Error whitelisting: ${error}`);
        }
    }

    if (interaction.commandName === 'help') {
        interaction.reply(
                {
                content: 'Useage: /whitelist [Minecraft Username] [Optional: Discord nickname] (without the [])\nDescription: Whitelists the selected Minecraft username on the server.\nRequirements:\n\t- The command issuer MUST have the \"Trusted\" role.\n\t- If the person being whitelisted is on the Discord server, include that in the command (although this is not required).\n\nAdditional info: Be carefule who you whitelist! You are responsible for them, and any punishment they recieve, for a while, will be applied to you too (within reason)!',
                ephemeral: true
                }
            );
    }
});

client.login(process.env.TOKEN);