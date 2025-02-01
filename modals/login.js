const ValoAPI = require('../utils/ValoAPI');

module.exports = {
    customID: 'riot-login',
    execute: async function(interaction, client, args) {
        const aTURL = interaction.fields.getTextInputValue(`accessTokenURL`);

        const valApi = new ValoAPI({ accessTokenURL: aTURL, SkinsData: client.skins, SkinsTier: client.skinsTier });

        await valApi.initialize();

        const { access_token, entitlement_token, user_uuid } = valApi.getTokens();

        const UserAcc = client.db.prepare(`SELECT * FROM User WHERE UserId = ?`).get(interaction.user.id);

        const ExpireDate = Math.floor(Date.now() + 59 * 60 * 1000);

        if (UserAcc) {
            client.db.prepare(`
                UPDATE User 
                SET accessToken = ?, 
                    entitlementToken = ?, 
                    userUUID = ?, 
                    expires = ? 
                WHERE UserId = ?
            `).run(access_token, entitlement_token, user_uuid, `${ExpireDate}`, interaction.user.id);            
        } else {
            client.db.prepare(`
                INSERT INTO User (UserId, accessToken, entitlementToken, userUUID, expires) 
                VALUES (?, ?, ?, ?, ?)
            `).run(interaction.user.id, access_token, entitlement_token, user_uuid, `${ExpireDate}`);
        }

        await interaction.reply({ content: `Successfully logged in! Expires (<t:${Math.floor(ExpireDate / 1000)}:R>)`, ephemeral: true });
    }
}