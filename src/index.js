require('dotenv').config();
const {Client, IntentsBitField, Message} = require("discord.js");
const {Rcon} = require("rcon-client");
const quote = require('shell-quote/quote');

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
                console.log(`${interaction.member.user.username} whitelist add Minecraft: ${interaction.options.get('minecraft-username').value}`);

                // check for interaction in the correct channel
                const channel = await client.channels.cache.get('1103163793284010024'); // Needs to be changed to server bots channel

                if (!channel) {
                    interaction.reply({content: 'Channel does not exist!', ephemeral: true});
                    return;
                }
                                                // Needs to be changed to server bots channel
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
                
                try {
                    // handel RCON
                    const rcon = await Rcon.connect({
                        host: "romaetplus.amdreier.com", port: 2570, password: process.env.RCON_PSWD
                    });

                    await rcon.send(`say From Whitelist-bot: ${quote([interaction.member.user.username])} added ${quote([interaction.options.get('minecraft-username').value])} to the Whitelist`);
        
                    let response = await rcon.send(`whitelist add ${quote([interaction.options.get('minecraft-username').value])}`);
                    
                    await interaction.followUp(`Server response: ${response}`);
                    
                    rcon.end();
                } catch (err) {
                    await interaction.followUp('Error adding player to whitelist. Please try again later.');
                    console.log(`Error connecting to RCON: ${err}`)
                }
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

    // /verify [login-username] [login-token]
    if (interaction.commandName === 'verify') {
        try {
            (async () => {
                const login_username = interaction.options.get('login-username')?.value || "";
                const disc_username = interaction.user.username;
                const disc_uid = interaction.user.id;
                const token = interaction.options.get('login-token')?.value || "";
                var success = false;
                var expired = false;

                await fetch("https://romaetplus.amdreier.com/api/verify", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        login_username: login_username,
                        disc_username: disc_username,
                        disc_uid: disc_uid,
                        token: token,
                        api_key: process.env.API_KEY
                    }),
                })
                .then(res => {
                    if (res.status == 200) {
                        success = true;
                    } else if (res.status == 410) {
                        expired = true;
                    }
                })

                const successMsg = "You\'re discord has been verified!";
                const expiredMsg = "You're token is expired! Please log into the website and generate a new one.";
                const errMsg = "There was an error verifying your Discord account. Please make sure the username you entered is the same one you used to log into the website and generate this token."
                const reply = success ? successMsg : expired ? expiredMsg : errMsg;

                interaction.reply(
                    {
                    content: reply,
                    ephemeral: true
                    }
                );
            })();
        } catch (error) {
            
        }
    }

    // /reset-password [login-username]
    if (interaction.commandName === 'reset-password') {
        try {
            (async () => {
                const login_username = interaction.options.get('login-username')?.value || "";
                const disc_uid = interaction.user.id;
                var success = false;
                var link = "";

                await fetch(`https://romaetplus.amdreier.com/api/resetLink?login_username=${login_username}&disc_uid=${disc_uid}&api_key=${process.env.API_KEY}`)
                .then(res => {
                    if (res.status == 200) {
                        success = true;
                        link = res.text();
                    }
                })

                const successMsg = `Here is you're reset link: ${link}. This will expire in 24 hours.`;
                const errMsg = "There was an error generating your link. Please make sure the username you entered is the same one you used to log into the website, and your Discord account is verified."

                interaction.reply(
                    {
                    content: success ? successMsg : errMsg,
                    ephemeral: true
                    }
                );
            })();
        } catch (error) {
            
        }
    }
});

client.login(process.env.TOKEN);
