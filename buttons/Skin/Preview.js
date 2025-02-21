module.exports = {
    customID: 'skin-preview',
    execute: async function(interaction, client, args) {
        const PreviewType = args[0];
        const skinUUID = args[1];
        const index = args[2];

        const foundSkin = client.skins.find(s => s["uuid"] === skinUUID);

        const Video = PreviewType == 'chromas' && index == "0" ? foundSkin["levels"][index]["streamedVideo"] : foundSkin[PreviewType][index]["streamedVideo"];

        await interaction.reply({ content: Video, ephemeral: true });
    }
}