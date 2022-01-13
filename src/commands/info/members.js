const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const emojis = require("../../utils/emojis.json");
const { stripIndent } = require("common-tags");

module.exports = class MembersCommand extends Command {
  constructor(client) {
    super(client, {
      name: "members",
      aliases: ["memberstatus"],
      usage: "members",
      description:
        "Displays how many server members are online, busy, AFK, and offline.",
      type: client.types.INFO,
    });
  }
  run(message) {
    const members = message.guild.members.cache;
    const online = members
      .filter((m) => m.presence && m.presence.status === "online")
      .map((v) => v).length;
    const offline = members
      .filter(
        (m) => (m.presence && m.presence.status === "offline") || !m.presence
      )
      .map((v) => v).length;
    const dnd = members
      .filter((m) => m.presence && m.presence.status === "dnd")
      .map((v) => v).length;
    const afk = members
      .filter((m) => m.presence && m.presence.status === "idle")
      .map((v) => v).length;
    const embed = new MessageEmbed()
      .setTitle(`Member Status [${message.guild.members.cache.size}]`)
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(
        stripIndent`
        ${emojis.online} **Online:** \`${online}\` members
        ${emojis.dnd} **Busy:** \`${dnd}\` members
        ${emojis.idle} **AFK:** \`${afk}\` members
        ${emojis.offline} **Offline:** \`${offline}\` members
      `
      )
      .setFooter(
        message.member.displayName,
        message.author.displayAvatarURL({ dynamic: true })
      )
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    message.channel.send({ embeds: [embed] });
  }
};
