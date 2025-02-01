const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    customID: 'login-button',
    execute: async function(interaction, client, args) {
        const Modal = new ModalBuilder()
        .setCustomId('riot-login')
        .setTitle('Riot Login')
        .addComponents(
            new ActionRowBuilder()
            .addComponents(
                new TextInputBuilder()
                .setCustomId('accessTokenURL')
                .setLabel('URL')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter url')
            )
        )

        await interaction.showModal(Modal);
    }
}