import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Stagehand, ConstructorParams } from "@browserbasehq/stagehand";
import { z } from "zod";

// Optional: Define configuration schema to require configuration at connection time
export const configSchema = z.object({
  debug: z.boolean().default(false).describe("Enable debug logging"),
  browserbaseApiKey: z.string().describe("Browserbase API key (falls back to env BROWSERBASE_API_KEY)"),
  browserbaseProjectId: z.string().describe("Browserbase project ID (falls back to env BROWSERBASE_PROJECT_ID)"),
  openaiApiKey: z.string().describe("OpenAI API key for AI actions (falls back to env OPENAI_API_KEY)"),
  contextId: z.string().optional().describe("Browserbase context ID for persistent sessions to maintain login state (falls back to env BROWSERBASE_CONTEXT_ID)"),
});

export default function createStatelessServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  // Merge config with environment variables for testing 
  // const resolvedConfig = {
  //   debug: config.debug,
  //   browserbaseApiKey: config.browserbaseApiKey ?? process.env.BROWSERBASE_API_KEY ?? "",
  //   browserbaseProjectId: config.browserbaseProjectId ?? process.env.BROWSERBASE_PROJECT_ID ?? "",
  //   openaiApiKey: config.openaiApiKey ?? process.env.OPENAI_API_KEY,
  //   contextId: config.contextId ?? process.env.BROWSERBASE_CONTEXT_ID,
  // } as z.infer<typeof configSchema>;
  const resolvedConfig = config;
 
  const server = new McpServer({
    name: "Twitter MCP",
    version: "1.0.0",
  });
 
  const stagehandConfig: ConstructorParams = {
    env: "BROWSERBASE",
    apiKey: resolvedConfig.browserbaseApiKey,
    projectId: resolvedConfig.browserbaseProjectId,
    verbose: resolvedConfig.debug ? 1 : 0,
    modelName: "gpt-4o",
    browserbaseSessionCreateParams: {
      projectId: resolvedConfig.browserbaseProjectId!,
      proxies: true,
      browserSettings: {
        viewport: {
          width: 1024,
          height: 768,
        },
        advancedStealth: true,
        context: {
          id: resolvedConfig.contextId!,
        },
      },
    },
    modelClientOptions: resolvedConfig.openaiApiKey ? {
      apiKey: resolvedConfig.openaiApiKey,
    } : undefined,
  };

  // Tool to post a tweet
  server.tool(
    "twitter_post",
    "Post a tweet to Twitter",
    {
      text: z.string().describe("Tweet text to post"),
      replyToUrl: z.string().optional().describe("URL of tweet to reply to (optional)"),
    },
    async ({ text, replyToUrl }) => {
      const stagehand = new Stagehand(stagehandConfig);
      
      try {
        await stagehand.init();
        const page = stagehand.page;

        // Navigate to Twitter or specific tweet if replying
        if (replyToUrl) {
          await page.goto(replyToUrl, { waitUntil: 'domcontentloaded' });
          // Click reply button
          await page.act("click the reply button");
        } else {
          await page.goto("https://twitter.com/compose/tweet", { waitUntil: 'domcontentloaded' });
        }
        
        // Wait for compose area and type the tweet
        await page.act(`type "${text}" in the tweet compose area`);
        
        // Post the tweet
        await page.act("click the post button to publish the tweet");
        
        // Brief wait to ensure the request is sent
        await page.waitForTimeout(2000);
        await stagehand.close();

        return {
          content: [
            {
              type: "text",
              text: `Successfully posted tweet: "${text}"${replyToUrl ? ` as reply to ${replyToUrl}` : ''}`
            }
          ],
        };
      } catch (error) {
        await stagehand.close();
        return {
          content: [
            {
              type: "text",
              text: `Error posting tweet: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
        };
      }
    }
  );

  // Tool to search for tweets
  server.tool(
    "twitter_search",
    "Search for tweets on Twitter",
    {
      query: z.string().describe("Search query to find tweets"),
      count: z.number().default(10).describe("Number of search results to return"),
    },
    async ({ query, count }) => {
      const stagehand = new Stagehand(stagehandConfig);
      
      try {
        await stagehand.init();
        const page = stagehand.page;

        // Navigate to Twitter search
        const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(query)}&src=typed_query`;
        await page.goto(searchUrl);
        
        // Use Stagehand's act method to interact with search results
        await page.act("Scroll down to load more search results");
        
        // Use extract to get structured tweet data
        const tweets = await page.extract({
          instruction: `Extract the first ${count} tweets from the search results including tweet text, author username, and timestamp`,
          schema: z.object({
            tweets: z.array(z.object({
              text: z.string().describe("The tweet content text"),
              author: z.string().describe("The username of the tweet author"),
              timestamp: z.string().optional().describe("When the tweet was posted"),
              engagement: z.string().optional().describe("Likes, retweets, replies count if visible")
            }))
          })
        });

        await stagehand.close();

        const tweetList = tweets.tweets || [];
        
        return {
          content: [
            {
              type: "text",
              text: `Found ${tweetList.length} tweets for query: "${query}"\n\n${tweetList.map((tweet, i) => 
                `${i + 1}. @${tweet.author}\n${tweet.text}\n${tweet.timestamp ? `Posted: ${tweet.timestamp}` : ''}${tweet.engagement ? `\nEngagement: ${tweet.engagement}` : ''}\n`
              ).join('\n')}`
            }
          ],
        };
      } catch (error) {
        await stagehand.close();
        return {
          content: [
            {
              type: "text",
              text: `Error searching tweets: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
        };
      }
    }
  );

  // Tool to get current context ID for future persistent sessions
  server.tool(
    "get_context_id",
    "Get the current Browserbase context ID for persistent sessions",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text: resolvedConfig.contextId 
              ? `Current context ID: ${resolvedConfig.contextId}\n\nThis context ID is being used to maintain your browser session across requests.`
              : "No context ID configured. After logging in, you can retrieve a context ID from Browserbase to maintain persistent sessions.\n\nTo use a context ID, pass it in the configuration when connecting to this MCP server."
          }
        ],
      };
    }
  );

  server.tool(
    "set_context_id",
    "Set the context ID for persistent sessions",
    {
      contextId: z.string().describe("The context ID to set"),
    },
    async ({ contextId }) => {
      resolvedConfig.contextId = contextId;
      return {
        content: [
          {
            type: "text",
            text: `Context ID set to: ${contextId}`
          }
        ],
      };
    }
  );

  return server.server;
}
