# Twitter MCP Server

An MCP (Model Context Protocol) server that provides Twitter automation tools using Browserbase and Stagehand for browser automation.

## Features

- **twitter_post**: Post tweets or replies to Twitter
- **twitter_search**: Search for tweets on Twitter with structured results
- **get_context_id**: Get the current Browserbase context ID for persistent sessions
- **set_context_id**: Set the context ID for persistent browser sessions

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your environment variables (create a `.env` file):
```env
BROWSERBASE_API_KEY=your_browserbase_api_key
BROWSERBASE_PROJECT_ID=your_browserbase_project_id
OPENAI_API_KEY=your_openai_api_key  # Optional
BROWSERBASE_CONTEXT_ID=your_context_id  # Optional, for persistent sessions
```

3. Run the development server:
```bash
npm run dev
```

## Tools

### twitter_post

Posts a tweet to Twitter or replies to an existing tweet.

**Parameters:**
- `text` (required): Tweet text to post
- `replyToUrl` (optional): URL of tweet to reply to

**Example:**
```typescript
// Post a new tweet
{ text: "Hello Twitter!" }

// Reply to a tweet
{ text: "Great point!", replyToUrl: "https://twitter.com/user/status/123456789" }
```

### twitter_search

Searches for tweets on Twitter and returns structured results.

**Parameters:**
- `query` (required): Search query to find tweets
- `count` (optional): Number of search results to return (default: 10)

**Returns:**
- Tweet text, author username, timestamp, and engagement metrics

**Example:**
```typescript
{ query: "machine learning", count: 5 }
```

### get_context_id

Retrieves the current Browserbase context ID being used for persistent sessions.

**Parameters:** None

**Returns:** Current context ID or information about setting one up

### set_context_id

Sets the context ID for maintaining persistent browser sessions across requests.

**Parameters:**
- `contextId` (required): The context ID to set

**Example:**
```typescript
{ contextId: "ctx_abc123xyz" }
```

## Configuration

The server supports the following configuration options:

```typescript
{
  browserbaseApiKey?: string,    // Browserbase API key (falls back to env BROWSERBASE_API_KEY)
  browserbaseProjectId?: string, // Browserbase project ID (falls back to env BROWSERBASE_PROJECT_ID)
  openaiApiKey?: string,         // OpenAI API key for AI actions (falls back to env OPENAI_API_KEY)
  contextId?: string,            // Browserbase context ID for persistent sessions (falls back to env BROWSERBASE_CONTEXT_ID)
  debug?: boolean               // Enable debug logging (default: false)
}
```

## Persistent Sessions

This server supports persistent browser sessions through Browserbase context IDs. This allows you to:

- Maintain login state across multiple requests
- Avoid repeated authentication flows
- Preserve browser cookies and session data

To use persistent sessions:
1. Set up a context ID using `set_context_id` or configure `BROWSERBASE_CONTEXT_ID` in your environment
2. The server will use this context for all browser operations
3. Your Twitter login session will persist across tool calls

## Authentication

This server uses Browserbase for browser automation, which handles Twitter authentication through the browser session. Make sure your Browserbase session is authenticated with Twitter for the tools to work properly. Use persistent sessions with context IDs to maintain login state.