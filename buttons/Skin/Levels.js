module.exports = {
    customID: 'skin-level',
    execute: async function(interaction, client, args) {
        const skin = client.skins.find(s => s["uuid"] === args[0]);

        const SelectedLevel = skin["levels"][Number(args[1])];
        const BaseVariantImage = skin["chromas"][0]["displayIcon"] || skin["displayIcon"];
        const LevelPreviewVideo = SelectedLevel["streamedVideo"];

        const ChromaComponents = interaction.message.components[0];
        const LevelComponents = interaction.message.components[1];
        const PreviewComponents = interaction.message.components[2];

        let i = 0;
        for (const ChromaComponent of ChromaComponents["components"]) {
            if (i == 0) { //args[1]) {
                ChromaComponent["data"]["disabled"] = true;
            } else {
                ChromaComponent["data"]["disabled"] = false;
            }
            i++;
        }

        i = 0;
        for (const LevelComponent of LevelComponents["components"]) {
            if (i == Number(args[1])) {
                LevelComponent["data"]["disabled"] = true;
            // } else if (Number(args[1]) === 0 && i === 0) {
            //     LevelComponent["data"]["disabled"] = true;
           } else {
                LevelComponent["data"]["disabled"] = false;
            }
            i++;
        }

        PreviewComponents["components"][0]["data"]["custom_id"] = PreviewComponents["components"][0]["data"]["custom_id"].slice(0, -1) + "0";
        PreviewComponents["components"][1]["data"]["custom_id"] = PreviewComponents["components"][1]["data"]["custom_id"].slice(0, -1) + args[1];

        PreviewComponents["components"][0]["data"]["disabled"] = LevelPreviewVideo ? false : true;
        PreviewComponents["components"][1]["data"]["disabled"] = skin["levels"][0]["streamedVideo"] ? false : true;

        const Embed = interaction.message.embeds[0];

        Embed["data"]["image"] = {
            "url": BaseVariantImage
        }

        await interaction.update({ embeds: [Embed], components: [ChromaComponents, LevelComponents, PreviewComponents] });
    }
}