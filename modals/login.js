const ValoAPI = require('../utils/ValoAPI');
const { buildServerSelectMenu } = require('../menus/serverSelect');

module.exports = {
	customID: 'riot-login',
	execute: async function(interaction, client, args) {
		try {
			const aTURL = interaction.fields.getTextInputValue('accessTokenURL');

			const valApi = new ValoAPI({ 
				accessTokenURL: aTURL, 
				SkinsData: client.skins, 
				SkinsTier: client.skinsTier 
			});
			await valApi.initialize();
			const { access_token, entitlement_token, user_uuid } = valApi.getTokens();

			if (!client.tempTokens) client.tempTokens = {};
			client.tempTokens[interaction.user.id] = { access_token, entitlement_token, user_uuid };

			await interaction.deferReply({ ephemeral: true });

			const row = buildServerSelectMenu();
			await interaction.editReply({
				content: 'Successfully logged in! Please select your server:',
				components: [row]
			});
		} catch (error) {
			console.error(`[${new Date().toISOString()}] Error in 'riot-login' modal:`, error);

			if (!interaction.replied) {
				await interaction.reply({
					content: 'An error occurred during login. Please try again later.',
					ephemeral: true
				});
			} else {
				await interaction.editReply({
					content: 'An error occurred during login. Please try again later.',
					components: []
				});
			}
		}
	}
};
