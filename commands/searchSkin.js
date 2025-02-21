const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')

function addSpaceBeforeCapitalized(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1 $2');
}

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

        const skinPrice = await fetch("https://val-skin-price.vercel.app/beta/skins/" + skinUUID);
        const skinPriceData = await skinPrice.json();

        const Embed = new EmbedBuilder()
        .setColor(`#${skinTier["highlightColor"].slice(0, -2)}` || "DarkerGrey")
        .setTitle(foundSkin["displayName"]["en-US"])
        .setThumbnail(skinTier["displayIcon"])
        .setImage(foundSkin["levels"][0]["displayIcon"] || foundSkin["displayIcon"])
        .setDescription(`Price: ${skinPriceData["price"] || skinTier["price"] || 'Error!'} ${client.config.Emojis["ValoPoints"]}`)

        const SkinChromas = new ActionRowBuilder()
        const SkinLevels = new ActionRowBuilder()
        const Previews = new ActionRowBuilder()
        
        let i = 0;

        for (const chroma of foundSkin["chromas"]) {
            const chromaEmojiData = client.swatch.find(s => s.uuid == chroma["uuid"]);

            const ChromaButton = new ButtonBuilder()
            .setCustomId(`skin-chroma_${skinUUID}_${i}`)
            .setStyle(ButtonStyle.Primary)
            .setLabel(`${i == 0 ? "Base Variant" : `Variant ${i}`}`)
            .setDisabled(i == 0 ? true : false)
            
            if (chromaEmojiData) {
                ChromaButton.setEmoji({ id: chromaEmojiData["emojiId"] });
            }

            SkinChromas.addComponents(
                ChromaButton
            )
            i++;
        }

        i = 0;

        for (const level of foundSkin["levels"]) {
            const LevelItem = level["levelItem"] ? addSpaceBeforeCapitalized(level["levelItem"].split("::")[1]) : null;

            SkinLevels.addComponents(
                new ButtonBuilder()
                .setCustomId(`skin-level_${skinUUID}_${i}`)
                .setStyle(ButtonStyle.Primary)
                .setLabel(`${i == 0 ? 'Base Level' : `Level ${i} - ${LevelItem}`}`)
                .setDisabled(i == 0 ? true : false)
            )
            i++;
        }

        Previews.addComponents(
            new ButtonBuilder()
            .setCustomId(`skin-preview_chromas_${skinUUID}_0`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(foundSkin["levels"][0]["streamedVideo"] ? false : true)
            .setLabel(`Variant Preview`),

           new ButtonBuilder()
           .setCustomId(`skin-preview_levels_${skinUUID}_0`)
           .setDisabled(foundSkin["levels"][0]["streamedVideo"] ? false : true)
           .setStyle(ButtonStyle.Primary)
           .setLabel(`Level Preview`)
        )

        await interaction.reply({ embeds: [Embed], components: [SkinChromas, SkinLevels, Previews] });
    }
}