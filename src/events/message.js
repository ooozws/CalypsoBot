const { MessageEmbed } = require("discord.js");
const { oneLine } = require("common-tags");

module.exports = (client, message) => {
  if (
    message.channel.type === "dm" ||
    !message.channel.viewable ||
    message.author.bot
  )
    return;

  // Get disabled commands
  let disabledCommands =
    client.db.settings.selectDisabledCommands.pluck().get(message.guild.id) ||
    [];
  if (typeof disabledCommands === "string")
    disabledCommands = disabledCommands.split(" ");

  // Get points
  const {
    point_tracking: pointTracking,
    message_points: messagePoints,
    command_points: commandPoints,
  } = client.db.settings.selectPoints.get(message.guild.id);

  // Command handler
  const prefix = client.db.settings.selectPrefix.pluck().get(message.guild.id);
  const prefixRegex = new RegExp(
    `^(<@!?${client.user.id}>|${prefix.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    )})\\s*`
  );

  if (prefixRegex.test(message.content)) {
    // Get mod channels
    let modChannelIds =
      message.client.db.settings.selectModChannelIds
        .pluck()
        .get(message.guild.id) || [];
    if (typeof modChannelIds === "string")
      modChannelIds = modChannelIds.split(" ");

    const [, match] = message.content.match(prefixRegex);
    const args = message.content.slice(match.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    let command = client.commands.get(cmd) || client.aliases.get(cmd); // If command not found, check aliases
    if (command && !disabledCommands.includes(command.name)) {
      // Check if mod channel
      if (modChannelIds.includes(message.channel.id)) {
        if (
          command.type != client.types.MOD ||
          (command.type == client.types.MOD &&
            message.channel
              .permissionsFor(message.author)
              .missing(command.userPermissions) != 0)
        ) {
          // Update points with messagePoints value
          if (pointTracking)
            client.db.users.updatePoints.run(
              { points: messagePoints },
              message.author.id,
              message.guild.id
            );
          return; // Return early so Calypso doesn't respond
        }
      }

      // Check permissions
      const permission = command.checkPermissions(message);
      if (permission) {
        // Update points with commandPoints value
        if (pointTracking)
          client.db.users.updatePoints.run(
            { points: commandPoints },
            message.author.id,
            message.guild.id
          );
        message.command = true; // Add flag for messageUpdate event
        return command.run(message, args); // Run command
      }
    } else if (
      (message.content === `<@${client.user.id}>` ||
        message.content === `<@!${client.user.id}>`) &&
      message.channel
        .permissionsFor(message.guild.me)
        .has(["SEND_MESSAGES", "EMBED_LINKS"]) &&
      !modChannelIds.includes(message.channel.id)
    ) {
      console.log("message.guild.channels", message.guild.channels.cache.get('924819110192353320'));
      const embed = new MessageEmbed()
        .setTitle("Hi, I'm Titan Bot. Need help?")
        .setThumbnail("https://titan.game/titangamelogo.png")
        .setDescription(
          `You can see everything I can do by using the \`${prefix}help\` command.`
        )
        // .addField('Titan Game Website', oneLine`
        //   https://titan.game
        //   [open](https://titan.game)!
        // `)
        .addField(
          "Titan Game Website",
          oneLine`
          https://titan.game
        `
        )
        .addField("Faq", oneLine`${message.guild.channels.cache.get('924819110192353320').toString()}`)
        // .setFooter('DM Nettles#8880 to speak directly with the developer!')
        .setColor(message.guild.me.displayHexColor);
      message.channel.send({ embeds: [embed] });
    }
  }

  // Update points with messagePoints value
  if (pointTracking)
    client.db.users.updatePoints.run(
      { points: messagePoints },
      message.author.id,
      message.guild.id
    );
};
