require('./utils/ProcessHandlers.js')();
require('./utils/InteractionOverrides.js')();

const PREFIX = '!';

const { Client, PermissionsBitField: { Flags: Permissions } } = require('discord.js');
const db = require('better-sqlite3')('database.db');

const client = new Client({
	intents: [
		'Guilds',
		'GuildMessages',
		'MessageContent',
	]
});

db.exec(`
	CREATE TABLE IF NOT EXISTS User (
		UserId TEXT,
		accessToken TEXT,
		entitlementToken TEXT,
		userUUID TEXT,
		expires TEXT,
		serverURL TEXT
    );
`);

client.config = require('./config.json');
client.logs = require('./utils/Logs.js');
client.cooldowns = new Map();
client.db = db;
client.skins;
client.skinsTier;	

require('./utils/ComponentLoader.js')(client);
require('./utils/EventLoader.js')(client);
require('./utils/RegisterCommands.js')(client);

async function fetchValorantAPI() {
	const skinsData = await fetch("https://valorant-api.com/v1/weapons/skins?language=all");

	if (skinsData.status !== 200) {
		client.logs.error(`Failed to fetch skins from API!`);
	}

	const skinsJson = await skinsData.json();

	const tierData = await fetch("https://valorant-api.com/v1/contenttiers/");

	if (tierData.status !== 200) {
		client.logs.error(`Failed to fetch skins from API!`);
	}

	const tierJson = await tierData.json();

	for (const Tier of tierJson["data"]) {
		switch (Tier.uuid) {
			case "12683d76-48d7-84a3-4e09-6985794f0445":
				Tier.price = 875;
				break;
			case "0cebb8be-46d7-c12a-d306-e9907bfc5a25":
				Tier.price = 1275;
				break;
			case "60bca009-4182-7998-dee7-b8a2558dc369":
				Tier.price = 1775;
				break;
			case "e046854e-406c-37f4-6607-19a9ba8426fc":
				Tier.price = 2175;
				break;
			case "411e4a55-4e59-7757-41f0-86a53f101bb5":
				Tier.price = 2475;
				break;
			default:
				Tier.price = 0;
				break;
		}
	}

	const swatchData = await fetch("https://api.arnsfh.xyz/v1/valorant/data/swatch");

	if (swatchData.status !== 200) {
		client.logs.error(`Failed to fetch swatch data from API!`);
	} 

	const swatchJson = await swatchData.json();

	client.swatch = swatchJson;
	client.skins = skinsJson["data"];
	client.skinsTier = tierJson["data"];

	client.logs.info(`Fetched ${skinsJson["data"].length} skins from API.`);
	client.logs.info(`Fetched ${tierJson["data"].length} tiers from API.`);
	client.logs.info(`Fetched ${swatchJson.length} swatches from API.`);
}

client.logs.info(`Logging in...`);
client.login(client.config.TOKEN);
client.on('ready', async function () {
	client.logs.custom(`Logged in as ${client.user.tag}!`, 0x7946ff);

	await fetchValorantAPI();
	// It's a weird place but I am assuming by the time it logs in you are finished adding events
	// Adding events after it runs this function will not get checked
	require('./utils/CheckIntents.js')(client);
	require('./utils/FileWatch.js')(client); // listener for hot loading
});

function CheckGuildAccess(requiredGuilds, guildID) {
	if (Array.isArray(requiredGuilds) && !requiredGuilds.includes(guildID)) {
		throw ['You don\'t have permission to use this command!', 'Guild not whitelisted'];
	}
}

function CheckUserAccess(requiredRoles, userIDs, member, user) {
	if (member && requiredRoles) {
		const hasRole = requiredRoles.some(roleID => member._roles.includes(roleID));
		if (!hasRole && !member.permissions.has('Administrator')) {
			throw ['You don\'t have permission to use this command!', 'Missing roles'];
		}
	}

	if (Array.isArray(userIDs) && !userIDs.includes(user.id)) {
		throw ['You don\'t have permission to use this command!', 'User not whitelisted'];
	}
}

function CheckPermissions(permissionsArray, member) {
	if (!Array.isArray(permissionsArray) || !member) return;

	const prefix = member.user.id === client.id ? 'I am' : 'You are';

	const missingPermissions = [];
	if (permissionsArray.length === 0) return;
	for (const permission of permissionsArray) {
		if (member.permissions.has(Permissions[permission])) continue;
		missingPermissions.push(permission);
	}

	if (missingPermissions.length > 0) {
		throw [`${prefix} missing the following permissions: \`${missingPermissions.join('`, `')}\``, 'Missing permissions'];
	}
}

function CheckCooldown(userID, command, cooldown) {
	const timeRemaining = client.cooldowns.get(`${userID}-${command}`) ?? 0;
	const remaining = (timeRemaining - Date.now()) / 1000;
	if (remaining > 0) {
		throw [`Please wait ${remaining.toFixed(1)} more seconds before reusing the \`${command}\` command!`, 'On cooldown'];
	}
	client.cooldowns.set(`${userID}-${command}`, Date.now() + cooldown * 1000);
}

async function InteractionHandler(interaction, type) {

	const args = interaction.customId?.split("_") ?? [];
	const name = args.shift();

	const component = client[type].get(name ?? interaction.commandName);
	if (!component) {
		await interaction.reply({
			content: `There was an error while executing this command!\n\`\`\`Command not found\`\`\``,
			ephemeral: true
		}).catch(() => { });
		client.logs.error(`${type} not found: ${interaction.customId}`);
		return;
	}

	try {
		CheckGuildAccess(component.guilds, interaction.guildId);
		CheckUserAccess(component.roles, component.users, interaction.member, interaction.user);
		CheckCooldown(interaction.user.id, component.customID ?? interaction.commandName, component.cooldown);

		const botMember = interaction.guild?.members.cache.get(client.user.id) ?? await interaction.guild?.members.fetch(client.user.id).catch(() => null);
		if (botMember !== null) {
			// This code will only trigger if
			// 1) Bot is in the guild (always will)
			// 2) Command not being run in DMs
			// 3) Client has GuildMembers intent
			// 4) Not actively rate limited
			CheckPermissions(component.clientPerms, botMember); // bot
			CheckPermissions(component.userPerms, interaction.member); // user
		}
	} catch ([response, reason]) {
		await interaction.reply({
			content: response,
			ephemeral: true
		}).catch(() => { });
		client.logs.error(`Blocked user from ${type}: ${reason}`);
		return;
	}

	try {
		if (interaction.isAutocomplete()) {
			await component.autocomplete(interaction, client, type === 'commands' ? undefined : args);
		} else {
			await component.execute(interaction, client, type === 'commands' ? undefined : args);
		}
	} catch (error) {
		client.logs.error(error.stack);
		await interaction.deferReply({ ephemeral: true }).catch(() => { });
		await interaction.editReply({
			content: `There was an error while executing this command!\n\`\`\`${error}\`\`\``,
			embeds: [],
			components: [],
			files: [],
			ephemeral: true
		}).catch(() => { });
	}
}

client.on('interactionCreate', async function (interaction) {
	if (!interaction.isCommand() && !interaction.isAutocomplete()) return;

	const subcommand = interaction.options._subcommand ?? "";
	const subcommandGroup = interaction.options._subcommandGroup ?? "";
	const commandArgs = interaction.options._hoistedOptions ?? [];
	const args = `${subcommandGroup} ${subcommand} ${commandArgs.map(arg => arg.value).join(" ")}`.trim();
	client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > /${interaction.commandName} ${args}`);

	await InteractionHandler(interaction, 'commands');
});


client.on('interactionCreate', async function (interaction) {
	if (!interaction.isButton()) return;
	client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > [${interaction.customId}]`);
	await InteractionHandler(interaction, 'buttons');
});


client.on('interactionCreate', async function (interaction) {
	if (!interaction.isStringSelectMenu()) return;
	client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > <${interaction.customId}>`);
	await InteractionHandler(interaction, 'menus');
});


client.on('interactionCreate', async function (interaction) {
	if (!interaction.isModalSubmit()) return;
	client.logs.info(`${interaction.user.tag} (${interaction.user.id}) > {${interaction.customId}}`);
	await InteractionHandler(interaction, 'modals');
});

client.on('messageCreate', async function (message) {
	if (message.author.bot) return;
	if (!message.content?.startsWith(PREFIX)) return;

	const args = message.content.slice(PREFIX.length).split(/\s+/);
	const name = args.shift().toLowerCase();

	const command = client.messages.get(name);
	if (!command) {
		client.logs.error(`Command not found: ${name}`);
		return await message.reply(`There was an error while executing this command!\n\`\`\`Command not found\`\`\``).catch(() => { });
	}

	try {
		CheckGuildAccess(command.guilds, message.guildId);
		CheckUserAccess(command.roles, command.users, message.member, message.author);
		CheckCooldown(message.author.id, name, command.cooldown);

		const botMember = message.guild?.members.cache.get(client.user.id) ?? await message.guild?.members.fetch(client.user.id).catch(() => null);
		if (botMember !== null) {
			CheckPermissions(command.clientPerms, botMember); // bot
			CheckPermissions(command.userPerms, message.member); // user
		}
	} catch ([response, reason]) {
		await message.reply(response).catch(() => { });
		client.logs.error(`Blocked user from message: ${reason}`);
		return;
	}

	try {
		await command.execute(message, client, args);
	} catch (error) {
		client.logs.error(error.stack);
		await message.reply(`There was an error while executing this command!\n\`\`\`${error}\`\`\``).catch(() => { });
	} finally {
		client.cooldowns.set(message.author.id, Date.now() + command.cooldown * 1000);
		setTimeout(client.cooldowns.delete.bind(client.cooldowns, message.author.id), command.cooldown * 1000);
	}
});
