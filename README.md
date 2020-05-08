# LocusRedux
A redux of the Locus Discord bot, made by the people in the Friends server using *discord.js*.  Click [here](https://discord.gg/JbyQTPz) to join the server and get updates and help on how to contribute to the bot! (**Note**: the server is 18+ only)

## Contributing code
To contribute with your code, please check out the [board](https://github.com/macs0/LocusRedux/projects/1) to see what needs doing or if there are any bugs to fix (also the [issues](https://github.com/macs0/LocusRedux/issues) page works just as well for that). Please make sure your code respects the eslint rules or your pull request won't be approved until you fix all the linting problems. In this iteration, we use Husky to execute pre-commit scripts to make sure your local branch is up to standard.

## Running the bot
This section will be updated as the bot is currently under development. For now, you'll need **Node.js** version 12 or greater, with **npm** as the package manager.

### Installing dependencies
First, you need to clone the code off of this repository, which you can do by running the `git clone` command, or downloading the zip file from the top of the page.

Since the bot runs under a Node.js environment, you'll need to install all of its dependencies locally. You can do this by running `npm install`, which will download all the dependencies and install them under the `/node_modules` folder.

###  Setting up the config file
After you've installed all the dependencies you'll need to create a new config file for the bot to run off of. There is an example config file provided by us in `/src/assets/config.example.js`, which you can duplicate and rename to `config.js` and fill in the blank strings with the information of your own bot. This means you need to have created a Bot application in the [Discord Development Portal](https://discord.com/developers/applications) beforehand, and have access to its token. Remember to **NEVER EVER EVER** share your bot's token publicly.

### Running the bot
After getting the config file done, you can simply run the bot in the terminal via the `node index` command. This will open up an instance of the bot and you should see it online and running on Discord.
