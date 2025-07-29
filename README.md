# Twitter MCP Server

An MCP (Model Context Protocol) server that provides Twitter automation tools using Browserbase and Stagehand for browser automation.

## Features

- **twitter_screenshot_feed**: Take screenshots of Twitter feed posts
- **twitter_post**: Post tweets or replies to Twitter

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy the environment template:
```bash
cp .env.example .env
```

3. Configure your credentials in `.env`:
   - Get your Browserbase API key and project ID from [Browserbase](https://browserbase.com)
   - Optionally add your OpenAI API key for enhanced AI actions

4. Run the development server:
```bash
npm run dev
```

## Tools

### twitter_screenshot_feed

Takes a screenshot of Twitter feed posts.

**Parameters:**
- `url` (optional): Specific Twitter URL to screenshot (defaults to home feed)
- `count` (optional): Number of posts to capture in screenshot (default: 5)

### twitter_post

Posts a tweet to Twitter.

**Parameters:**
- `text`: Tweet text to post
- `replyToUrl` (optional): URL of tweet to reply to

## Configuration

The server requires the following configuration:

```typescript
{
  browserbaseApiKey: string,    // Required: Your Browserbase API key
  browserbaseProjectId: string, // Required: Your Browserbase project ID
  openaiApiKey?: string,        // Optional: OpenAI API key for AI actions
  debug?: boolean              // Optional: Enable debug logging (default: false)
}
```

## Authentication

This server uses Browserbase for browser automation, which handles Twitter authentication through the browser session. Make sure your Browserbase session is authenticated with Twitter for the tools to work properly.