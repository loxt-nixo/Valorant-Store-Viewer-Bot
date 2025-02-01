const { SlashCommandBuilder, ActionRowBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName('login')
    .setDescription('login for 1 hour!'),
    execute: async function (interaction, client) {
        const Embed = new EmbedBuilder()
        .setTitle('Login')
        .setDescription('Login your Riot Games account for 1 hour!\n`1.` Click get URL\n`2.` On the 404 Page copy the full URL\n`3.` Click the Login button and paste the copied URL')
        .setColor("Red")

        const Buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('login-button')
            .setLabel('Login')
            .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
            .setLabel('Get URL')
            .setURL('https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid')
            .setStyle(ButtonStyle.Link)
        )

        await interaction.reply({ embeds: [Embed], components: [Buttons], ephemeral: true });
    }
}