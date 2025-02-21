module.exports = {
    customID: 'skin-chroma',
    execute: async function(interaction, client, args) {
        const skin = client.skins.find(s => s["uuid"] === args[0]);

        const SelectedChroma = skin["chromas"][Number(args[1])];

        const ChromaImage = SelectedChroma["displayIcon"] || SelectedChroma["fullRender"];
        const ChromaPreviewVideo = SelectedChroma["streamedVideo"] || skin["levels"][0]["streamedVideo"];

        const ChromaComponents = interaction.message.components[0];
        const LevelComponents = interaction.message.components[1];
        const PreviewComponents = interaction.message.components[2];

        let i = 0;
        for (const ChromaComponent of ChromaComponents["components"]) {
            if (i == args[1]) {
                ChromaComponent["data"]["disabled"] = true;
            } else {
                ChromaComponent["data"]["disabled"] = false;
            }
            i++;
        }

        let levelId;

        i = 0;
        for (const LevelComponent of LevelComponents["components"]) {
            if (Number(args[1]) !== 0 && i === LevelComponents["components"].length - 1) {
                LevelComponent["data"]["disabled"] = true;
                levelId = i;
            } else if (Number(args[1]) === 0 && i === 0) {
                LevelComponent["data"]["disabled"] = true;
                levelId = i;
            } else {
                LevelComponent["data"]["disabled"] = false;
            }
            i++;
        }

        PreviewComponents["components"][0]["data"]["custom_id"] = PreviewComponents["components"][0]["data"]["custom_id"].slice(0, -1) + args[1];
        PreviewComponents["components"][1]["data"]["custom_id"] = PreviewComponents["components"][1]["data"]["custom_id"].slice(0, -1) + levelId;

        PreviewComponents["components"][0]["data"]["disabled"] = ChromaPreviewVideo ? false : true;
        PreviewComponents["components"][1]["data"]["disabled"] = skin["levels"][levelId]["streamedVideo"] ? false : true;

        const Embed = interaction.message.embeds[0];

        Embed["data"]["image"] = {
            "url": ChromaImage
        }

        await interaction.update({ embeds: [Embed], components: [ChromaComponents, LevelComponents, PreviewComponents] });
    }
}