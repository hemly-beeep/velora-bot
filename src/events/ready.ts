import { Client, ActivityType } from 'discord.js';

export default {
  name: 'ready',
  once: true,
  async execute(_: any, client: Client) {
    console.log(`[Velora] Logged in as ${client.user?.tag}`);
    console.log(`[Velora] Serving ${client.guilds.cache.size} guilds`);

    const activities = [
      { name: '??help | 100 Commands', type: ActivityType.Watching },
      { name: 'your server | Velora', type: ActivityType.Watching },
      { name: 'moderation magic', type: ActivityType.Playing },
    ];

    let i = 0;
    const setActivity = () => {
      client.user?.setActivity(activities[i % activities.length].name, { type: activities[i % activities.length].type });
      i++;
    };
    setActivity();
    setInterval(setActivity, 15000);
  },
};
