const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ValoAPI = require('../utils/ValoAPI');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('store')
    .setDescription('see your valorant store'),
    execute: async function (interaction, client) {
        const UserAcc = client.db.prepare(`SELECT * FROM User WHERE UserId = ?`).get(interaction.user.id);

        if (!UserAcc) return interaction.reply({ content: 'No account found! use /login', ephemeral: true });

        if (Date.now() > Number(UserAcc.expires)) return interaction.reply({ content: 'Account access token expired! use /login', ephemeral: true });

        const valApi = new ValoAPI({ SkinsData: client.skins, SkinsTier: client.skinsTier, accessToken: UserAcc.accessToken, entitlementToken: UserAcc.entitlementToken, userUUID: UserAcc.userUUID });

        await valApi.initialize();

        const wallet = await valApi.getWallet();

        const { StoreSkins, NewStore } = await valApi.getStore();

        let Embeds = [
            new EmbedBuilder()
            .setColor('LightGrey')
            .setTitle(`${interaction.user.username}'s Valorant Store`)
            .setDescription(`${wallet}\n\nNext Store in <t:${Math.floor(NewStore)}:R>`)
        ];

        for (const Skin of StoreSkins) {
            Embeds.push(
                new EmbedBuilder()
                .setColor(Skin.tier.color)
                .setTitle(`${Skin.tier.emoji} - ${Skin.name}`)
                .setDescription(`Price: ${Skin.price}`)
                .setThumbnail(Skin.icon)
            )
        }

        await interaction.reply({ embeds: Embeds });
    }
}