module.exports = client  => {
    console.log(`Logged in as ${client.user.tag}!`)
    client.channels.cache.get('805185737104425000').send("Le bot est opérationnel !");
    client.user.setPresence({ activity: { name: '=help || Artoria', type: 'PLAYING' }, status: 'dnd' })
}


const { Client } = require("discord.js");
const Eris = require('eris');
const Erelajs = require("erela.js");

const client = new Client()
const Manager = new Erelajs.Manager({
    nodes: [
        {
            host: "localhost",
            port: 8000,
            password: "idkpassword",
        }
    ],
    send(id, payload) {
        const guild = client.guilds.get(id);
        if(guild) {
            guild.shard.sendWS(payload.op, payload.d);
        }
    }
})

client.on("ready", () => {
    console.log(`Bot is ready!`)
    Manager.init(client.user.id);
})
client.on('rawWS', (d) => Manager.updateVoiceState(d));
Manager.on("nodeConnect", (node) => {
    console.log(`Connected to: ${node.options.identifier}`);
})

Manager.on("trackStart", (player, track) => {
    client.createMessage(message.channel.id, { embed: { title: "Now Playing", description: `Playing: [${track.title}](${track.uri})`}});
})

client.on("messageCreate", async(message) => {
    if(message.author.client) return;
    let prefix = "=";

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if(cmd == "play" || cmd == 'p') {
        const channel = message.member.voiceState.channelID;
        if(!channel) return client.createMessage(message.channel.id, "Vous devez etre dans un salon vocal.");

        let res;
        let search = args.join(" ");
        if(!search) return client.createMessage(message.channel.id, "Commande invalide. `=play <nom|URL>`");

        const player = Manager.create({
            guild: message.guildID,
            voiceChannel: channel,
            textChannel: message.channel.id,
            _selfDeafen: true
        });

        if(player.state != 'CONNECTED') await player.connect();

        res = await player.search(search, message.author)

        if(res.loadType == 'NO_MATCHES') {
            return client.createMessage(message.channel.id, `NO MATCH FOUND!`)
        } else if(res.loadType == 'PLAYLIST_LOADED') {
            player.queue.add(res.tracks);
            if(!player.playing || !player.paused || player.queue.totalSize === res.tracks.length) {
                player.play()
            }
        } else {
            player.queue.add(res.tracks[0]);
            if(!player.playing || !player.paused || player.queue.size) {
                player.play()
            }
        }
    }
})

client.login("***");
