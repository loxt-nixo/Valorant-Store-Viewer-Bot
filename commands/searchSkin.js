const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName('search-skin')
    .setDescription('search a skin by its name')
    .addStringOption(opt => opt
        .setName('name')
        .setDescription('Name of the skin to search!')
        .setRequired(true)
        .setAutocomplete(true)
    ),
    autocomplete: async function(interaction, client) {
        const focused = interaction.options.getFocused(true);

        if (focused.name === 'name') {
            let skins = [];

            if (focused.value) {
                skins = client.skins.filter(s => s["displayName"]["de-DE"].toLowerCase().includes(focused.value.toLowerCase()) || s["displayName"]["en-US"].toLowerCase().includes(focused.value.toLowerCase()));
            }

            interaction.respond( skins.slice(0, 25).map(d => ({ name: d["displayName"]["en-US"], value: d["uuid"] })) );
        }
    },
    execute: async function (interaction, client) {
        const skinUUID = interaction.options.getString('name');

        const foundSkin = client.skins.find(s => s["uuid"] === skinUUID);

        if (!foundSkin) return interaction.reply({ content: 'Skin not found!', hidden: true });

        const skinTier = client.skinsTier.find(s => s["uuid"] === foundSkin["contentTierUuid"]);

        const Embed = new EmbedBuilder()
        .setColor(`#${skinTier["highlightColor"].slice(0, -2)}` || "DarkerGrey")
        .setTitle(foundSkin["displayName"]["en-US"])
        .setThumbnail(skinTier["displayIcon"])
        .setImage(foundSkin["levels"][0]["displayIcon"] || foundSkin["displayIcon"])
        .setDescription(`Price: ${!foundSkin["displayName"]["en-US"].includes('Knife') ? skinTier["price"] || 0 : "1750 - 5950"} ${client.config.Emojis["ValoPoints"]}`)

        await interaction.reply({ embeds: [Embed] });
    }
}
