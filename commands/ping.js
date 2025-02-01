const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Pong!'),
    autocomplete: async function(interaction, client) {
        // this is optional, called on any autocomplete stuff
    },
    execute: async function(interaction, client) {
		await interaction.deferReply({ hidden: true, content: 'Pong!' });
		await interaction.reply('Pong again!');
		await interaction.reply('This is pretty cool lol');
    }
}
