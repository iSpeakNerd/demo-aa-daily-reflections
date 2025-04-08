# AA Daily Reflections discord bot

The **AA Daily Reflections** project is a serverless application designed to post daily reflections from Alcoholics Anonymous (AA) into Discord. This bot operates in two modes: **invoked** and **scheduled**. In invoked mode, users can trigger the bot using the `/reflections` command in Discord, while in scheduled mode, the bot automatically posts reflections at specified intervals using a Cron job on Netlify.

## Key Features

- **Discord Integration**: The bot interacts with users through Discord, fetching and displaying the AA Daily Reflections.
- **Serverless Architecture**: Uses Netlify Functions as an API for lower-level functions. Scales as needed and integrates with CI/CD pipeline through GitHub.
- **Database Management**: Utilizes Supabase (PostgreSQL) for storing reflections, ensuring type-safe database operations with auto-generated TypeScript types served through a PostgREST API.
- **Modular Design**: The codebase is organized into distinct modules, promoting maintainability and ease of debugging.

## Technology Stack

- **Discord.js**: For creating and managing Discord bot interactions and embeds.
- **Netlify**: For continuous integration and deployment, as well as scheduling tasks via Cron.
- **Supabase**: For database storage and management, providing a PostgreSQL backend with real-time capabilities.
- **TypeScript**: Ensures type safety and enhances code reliability throughout the application.

## Architectural Decisions

1. **Serverless Architecture**: The decision to use Netlify Functions allows for reduced operational complexity and cost-effective scaling. This architecture integrates seamlessly with version control and supports automatic deployments through a CI/CD pipeline on GitHub.

2. **Supabase as Database**: Supabase was chosen for its PostgreSQL compatibility and built-in authentication features. The use of generated types ensures type-safe database operations.

3. **TypeScript Implementation**: Full adoption of TypeScript enhances code reliability, improves maintainability, and provides static type checking, which is crucial for catching errors early in the development process.

4. **Modular Code Structure**: The clear separation between functions and utilities improves code organization, testability, and maintainability, allowing for reusable components.

5. **Centralized Error Handling**: A dedicated error handling module ensures consistent error management, making debugging easier and providing standardized error responses.

## Getting Started

### External Services

This project leverages several external services that require individual setup and secret saving.

### Secrets Setup

Create a `.env` file in the root directory. You will save credentials from each of the following services:

#### Discord

##### Discord Bot

Here's a guide to [creating a Discord bot](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot). Save your secrets as part of your setup.

      1. DISCORD_BOT_TOKEN = ''
      2. DISCORD_PUBLIC_KEY = ''
      3. DISCORD_CLIENT_ID = ''

##### Discord Server

The bot will output to the list of `DISCORD_WEBHOOK_URL_1`, `DISCORD_WEBHOOK_URL_2`, etc. from the `.env` file. You must have a valid Discord webhook url to see the output. [Create your own webhook](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) and save the url.

    1. DISCORD_WEBHOOK_URL_1 = ''

#### Supabase

Create your own Supabase project and [obtain the PostgREST API URL and Keys](https://supabase.com/docs/guides/api#api-url-and-keys).

    1. SUPABASE_URL = ''
    2. SUPABASE_SERVICE_ROLE_KEY = ''

#### Netlify

Follow Netlify's guide for [deploying a project from GitHub](https://docs.netlify.com/welcome/add-new-site/#import-from-an-existing-repository). Get the site URL from your project settings after deployment.

      1. NETLIFY_APP_URL = ''

### Running the Repository

To run this project locally, follow these steps:

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/yourusername/demo-aa-daily-reflections.git
   cd demo-aa-daily-reflections
   ```

2. **Install Dependencies**:

   ```bash
   pnpm install
   ```

3. **Set Up Environment Variables**:
   Your `.env` file should have all of the following secrets:

   1. DISCORD_BOT_TOKEN = ''
   2. DISCORD_PUBLIC_KEY = ''
   3. DISCORD_CLIENT_ID = ''
   4. SUPABASE_URL = ''
   5. SUPABASE_SERVICE_ROLE_KEY = ''
   6. NETLIFY_APP_URL = ''
   7. DISCORD_WEBHOOK_URL_1 = ''

   Follow the [steps above](#secrets-setup) if you do not yet have values for all the secrets.

4. **Run the Application**:

   Use the following command to start the development server:

   ```bash
   pnpm dev
   ```

5. **Invite the bot to a Server**

   Use the [bot invite link](https://discordjs.guide/preparations/adding-your-bot-to-servers.html#creating-and-using-your-invite-link) to add the bot to a Discord server.

6. **Activate the Bot**: Either of these will output the Daily Reflections to your Discord server.

   a. **Scheduled mode:** While the dev server is live, [Netlify Functions provide simulated scheduled activation](https://docs.netlify.com/cli/manage-functions/#invoke-functions-while-running-netlify-dev) by using the command

   ```bash
   pnpm netlify functions:invoke reflection
   ```

   b. **Invoked mode:** In the Discord server with the bot, use the command `/reflections` to fetch and post today's AA Daily Reflection.

   I have deployed a demo server that [you may join](https://discord.gg/scExqC4yzB) as a temporary member to use `/reflections` in without setting up your own server.

## Testing

The project includes a suite of unit tests located in the `/tests` directory. These tests cover various aspects of the application, including database operations and Discord interactions. To run a test file, use the following command:

```bash
pnpm ts PATH/FILENAME.ts
```

To do integration testing, run the dev server `pnpm dev` and then activate the API function with `pnpm netlify functions:invoke reflection` as described above.
