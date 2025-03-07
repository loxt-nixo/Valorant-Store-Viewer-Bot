const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const SERVERS = {
	"Asia Pacific (AP)": "https://pd.ap.a.pvp.net/",
	"North America (NA)": "https://pd.na.a.pvp.net/",
	"Europe (EU)": "https://pd.eu.a.pvp.net/",
	"Korea (KR)": "https://pd.kr.a.pvp.net/",
	"Brazil (BR)": "https://pd.br.a.pvp.net/",
	"Latin America (LATAM)": "https://pd.latam.a.pvp.net/"
};

function buildServerSelectMenu() {
	const options = Object.entries(SERVERS).map(([label, value]) => ({
		label,
		value
	}));
	const row = new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId('serverSelect')
			.setPlaceholder('Select your server')
			.addOptions(options)
	);
	return row;
}

module.exports = {
	buildServerSelectMenu,
	customID: 'serverSelect',
	execute: async function(interaction, client) {
		const tokens = client.tempTokens && client.tempTokens[interaction.user.id];
		if (!tokens) {
			return await interaction.reply({
				content: 'Session expired or tokens not found. Please try logging in again.',
				ephemeral: true
			});
		}

		const selectedServerURL = interaction.values[0];
		const regionEntry = Object.entries(SERVERS).find(([label, url]) => url === selectedServerURL);
		const regionName = regionEntry ? regionEntry[0] : selectedServerURL;

		const ExpireDate = Math.floor(Date.now() + 59 * 60 * 1000);
		const UserAcc = client.db.prepare(`SELECT * FROM User WHERE UserId = ?`).get(interaction.user.id);

		if (UserAcc) {
			client.db.prepare(`
				UPDATE User 
				SET accessToken = ?, 
					entitlementToken = ?, 
					userUUID = ?, 
					expires = ?,
					serverURL = ?
				WHERE UserId = ?
			`).run(tokens.access_token, tokens.entitlement_token, tokens.user_uuid, `${ExpireDate}`, selectedServerURL, interaction.user.id);
		} else {
			client.db.prepare(`
				INSERT INTO User (UserId, accessToken, entitlementToken, userUUID, expires, serverURL)
				VALUES (?, ?, ?, ?, ?, ?)
			`).run(interaction.user.id, tokens.access_token, tokens.entitlement_token, tokens.user_uuid, `${ExpireDate}`, selectedServerURL);
		}

		delete client.tempTokens[interaction.user.id];

		await interaction.update({
			content: `Server selected: ${regionName}. Your account has been successfully saved.`,
			components: []
		});
	}
};
