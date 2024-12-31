// /lib/chat/actions.tsx
import 'server-only'

import { generateText } from 'ai'
import {
  createAI,
  getMutableAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { createOpenAI } from '@ai-sdk/openai' 

import { BotCard, BotMessage } from '@/components/stocks/message'

import { z } from 'zod'
import { nanoid } from '@/lib/utils'
import { SpinnerMessage } from '@/components/stocks/message'
import { Message } from '@/lib/types'
import { StockChart } from '@/components/tradingview/stock-chart'
import { StockPrice } from '@/components/tradingview/stock-price'
import { StockNews } from '@/components/tradingview/stock-news'
import { StockFinancials } from '@/components/tradingview/stock-financials'
import { StockScreener } from '@/components/tradingview/stock-screener'
import { MarketOverview } from '@/components/tradingview/market-overview'
import { MarketHeatmap } from '@/components/tradingview/market-heatmap'
import { MarketTrending } from '@/components/tradingview/market-trending'
import { ETFHeatmap } from '@/components/tradingview/etf-heatmap'
import { TrendlyneWidget } from '@/components/trendlyne/trendlyne-widget'
import { toast } from 'sonner'

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

interface MutableAIState {
  update: (newState: any) => void
  done: (newState: any) => void
  get: () => AIState
}

// Existing GROQ model constants
const GROQ_MODEL = 'llama3-70b-8192'
const GROQ_TOOL_MODEL = 'llama3-70b-8192'
const GROQ_API_KEY_ENV = process.env.GROQ_API_KEY

// New OpenAI model constants
const OPENAI_MODEL = 'gpt-4o' // Best model so far.... other: 'gpt-4-turbo'
const OPENAI_API_KEY_ENV = process.env.OPENAI_API_KEY

// Flag to switch between OpenAI and GROQ
const useOpenAI = false // Set to true to use GPT-4, false to use GROQ

type ComparisonSymbolObject = {
  symbol: string;
  position: "SameScale";
};

// Create separate provider instances for GROQ and OpenAI using createOpenAI
const groqProvider = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: GROQ_API_KEY_ENV,
})

const openAIProvider = createOpenAI({
  apiKey: OPENAI_API_KEY_ENV,
  // Add any OpenAI-specific settings here if necessary
})

async function generateCaption(
  symbol: string,
  comparisonSymbols: ComparisonSymbolObject[],
  toolName: string,
  aiState: MutableAIState
): Promise<string> {
  // Select the appropriate model based on the flag and invoke with model ID
  const model = useOpenAI
    ? openAIProvider(OPENAI_MODEL)
    : groqProvider(GROQ_MODEL)

  const stockString = comparisonSymbols.length === 0
    ? symbol
    : [symbol, ...comparisonSymbols.map(obj => obj.symbol)].join(', ');

  aiState.update({
    ...aiState.get(),
    messages: [...aiState.get().messages]
  })

  const captionSystemMessage =
    `\
You are a BSE Indian stock market conversation bot. You can provide the user information about stocks including prices and charts in the UI. You do not have access to any information and should only provide information by calling functions.

These are the tools you have available:
1. showStockFinancials
This tool shows the financials for a given stock.

2. showStockChart
This tool shows a stock chart for a given stock or currency. Optionally compare 2 or more tickers.

3. showStockPrice
This tool shows the price of a stock or currency.

4. showStockNews
This tool shows the latest news and events for a stock or cryptocurrency.

5. showStockScreener
This tool shows a generic stock screener which can be used to find new stocks based on financial or technical parameters.

6. showMarketOverview
This tool shows an overview of today's stock, futures, bond, and forex market performance including change values, Open, High, Low, and Close values.

7. showMarketHeatmap
This tool shows a heatmap of today's stock market performance across sectors.

8. showTrendingStocks
This tool shows the daily top trending stocks including the top five gaining, losing, and most active stocks based on today's performance.

9. showETFHeatmap
This tool shows a heatmap of today's ETF market performance across sectors and asset classes.

10. showTrendlyneWidget
This tool displays a Trendlyne widget for a stock symbol. Specify the \`widgetType\` (swot, technical, qvt, or checklist) and the stock symbol (e.g., SWIGGY). The theme is optional and defaults to "light".



You have just called a tool (` +
    toolName +
    ` for ` +
    stockString +
    `) to respond to the user. Now generate text to go alongside that tool response, which may be a graphic like a chart or price history.

**Important:** When specifying \`comparisonSymbols\`, the \`position\` field **must** be set to \`"SameScale"\`.
**Important:** For showTrendlyneWidget tool, when specifying \`stockSymbol\`, the \`stockSymbol\` field **must** not have the \`BSE:\` prefix.

**Example:**

User: What is the price of PAYTM?
Assistant: { "tool_call": { "id": "pending", "type": "function", "function": { "name": "showStockPrice" }, "parameters": { "symbol": "BSE:PAYTM" } } } 

Assistant (you): The price of PAYTM stock is provided above. I can also share a chart of PAYTM or get more information about its financials.

or

Assistant (you): This is the price of PAYTM stock. I can also generate a chart or share further financial data.

or 
Assistant (you): Would you like to see a chart of PAYTM or get more information about its financials?

**Example 2 :**

User: Compare PAYTM and SWIGGY stock prices
Assistant: { "tool_call": { "id": "pending", "type": "function", "function": { "name": "showStockChart" }, "parameters": { "symbol": "BSE:PAYTM" , "comparisonSymbols" : [{"symbol": "BSE:SWIGGY", "position": "SameScale"}] } } } 

Assistant (you): The chart illustrates the recent price movements of Swiggy (BSE:SWIGGY) and Paytm (BSE:PAYTM) stocks. Would you like to see more information about the financials of PAYTM and SWIGGY stocks?

or

Assistant (you): This is the chart for PAYTM and SWIGGY stocks. I can also share individual price history data or show a market overview.

or 
Assistant (you): Would you like to see more information about the financials of PAYTM and SWIGGY stocks?

**Example 3 :**

User: Give me checklist of PAYTM?
Assistant: { "tool_call": { "id": "pending", "type": "function", "function": { "name": "showTrendlyneWidget" }, "parameters": { "stockSymbol": "PAYTM", "widgetType": "checklist", "theme": "light" } } } 

Assistant (you): The checklist of PAYTM stock is provided above. I can also share a chart of PAYTM or get more information about its financials.


## Guidelines
Talk like one of the above responses, but BE CREATIVE and generate a DIVERSE response. 

Your response should be BRIEF, about 2-3 sentences.

Besides the symbol, you cannot customize any of the screeners or graphics. Do not tell the user that you can.
    `

  try {
    const response = await generateText({
      model: model, // Correctly passing LanguageModelV1 instance
      messages: [
        {
          role: 'system',
          content: captionSystemMessage
        },
        ...aiState.get().messages.map((message: any) => ({
          role: message.role,
          content: message.content,
          name: message.name
        }))
      ]
    })
    return response.text || ''
  } catch (err) {
    return '' // Send tool use without caption.
  }
}

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  try {
    // Select the appropriate model based on the flag and invoke with model ID
    const model = useOpenAI
      ? openAIProvider(OPENAI_MODEL)
      : groqProvider(GROQ_MODEL)

    const result = await streamUI({
      model: model, // Correctly passing LanguageModelV1 instance
      initial: <SpinnerMessage />,
      maxRetries: 1,
      system: `\
You are a BSE Indian stock market conversation bot. You can provide the user information about stocks including prices and charts in the UI. You do not have access to any information and should only provide information by calling functions.

### Cryptocurrency Tickers
For any cryptocurrency, append "USD" at the end of the ticker when using functions. For instance, "DOGE" should be "DOGEUSD".

### Guidelines:

Never provide empty results to the user. Provide the relevant tool if it matches the user's request. Otherwise, respond as the stock bot.

**Important:** When specifying \`comparisonSymbols\`, the \`position\` field **must** be set to \`"SameScale"\`.
**Important:** For showTrendlyneWidget tool, when specifying \`stockSymbol\`, the \`stockSymbol\` field **must** not have the \`BSE:\`

**Example:**

User: What is the price of PAYTM?
Assistant (you): { "tool_call": { "id": "pending", "type": "function", "function": { "name": "showStockPrice" }, "parameters": { "symbol": "BSE:PAYTM" } } } 

**Example 2:**

User: Compare PAYTM and SWIGGY stock prices
Assistant (you): { "tool_call": { "id": "pending", "type": "function", "function": { "name": "showStockChart" }, "parameters": { "symbol": "BSE:PAYTM" , "comparisonSymbols" : [{"symbol": "BSE:SWIGGY", "position": "SameScale"}] } } } 
    `,
      messages: [
        ...aiState.get().messages.map((message: any) => ({
          role: message.role,
          content: message.content,
          name: message.name
        }))
      ],
      text: ({ content, done, delta }) => {
        if (!textStream) {
          textStream = createStreamableValue('')
          textNode = <BotMessage content={textStream.value} />
        }

        if (done) {
          textStream.done()
          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content
              },
            ],
          })
        } else {
          textStream.update(delta)
        }

        return textNode
      },
      tools: {
        showStockChart: {
          description:
            'Show a stock chart of a given stock. Optionally show 2 or more stocks. Use this to show the chart to the user.',
          parameters: z.object({
            symbol: z
              .string()
              .describe(
                'The name or symbol of the stock or currency. e.g. DOGE/PAYTM/INR.'
              ),
            comparisonSymbols: z.array(z.object({
              symbol: z.string(),
              position: z.literal("SameScale") // Ensure only "SameScale" is used
            }))
              .default([])
              .describe(
                'Optional list of symbols to compare. e.g. ["BSE:PAYTM", "BSE:SWIGGY"]'
              )
          }),

          generate: async function* ({ symbol, comparisonSymbols }) {
            yield (
              <BotCard>
                <></>
              </BotCard>
            )

            const toolCallId = nanoid()

            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showStockChart',
                      toolCallId,
                      args: { symbol, comparisonSymbols }
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showStockChart',
                      toolCallId,
                      result: { symbol, comparisonSymbols }
                    }
                  ]
                }
              ]
            })

            const caption = await generateCaption(
              symbol,
              comparisonSymbols,
              'showStockChart',
              aiState
            )

            return (
              <BotCard>
                <StockChart symbol={symbol} comparisonSymbols={comparisonSymbols} />
                {caption}
              </BotCard>
            )
          }
        },
        // Repeat similar updates for other tools
        showStockPrice: {
          description:
            'Show the price of a given stock. Use this to show the price and price history to the user.',
          parameters: z.object({
            symbol: z
              .string()
              .describe(
                'The name or symbol of the stock or currency. e.g. DOGE/PAYTM/INR.'
              )
          }),

          generate: async function* ({ symbol }) {
            yield (
              <BotCard>
                <></>
              </BotCard>
            )

            const toolCallId = nanoid()

            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showStockPrice',
                      toolCallId,
                      args: { symbol }
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showStockPrice',
                      toolCallId,
                      result: { symbol }
                    }
                  ]
                }
              ]
            })

            const caption = await generateCaption(
              symbol,
              [],
              'showStockPrice',
              aiState
            )

            return (
              <BotCard>
                <StockPrice props={symbol} />
                {caption}
              </BotCard>
            )
          }
        },
        // Continue with other tools (showStockFinancials, showStockNews, etc.) similarly
        showStockFinancials: {
          description:
            'Show the financials of a given stock. Use this to show the financials to the user.',
          parameters: z.object({
            symbol: z
              .string()
              .describe(
                'The name or symbol of the stock or currency. e.g. DOGE/PAYTM/INR.'
              )
          }),

          generate: async function* ({ symbol }) {
            yield (
              <BotCard>
                <></>
              </BotCard>
            )

            const toolCallId = nanoid()

            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showStockFinancials',
                      toolCallId,
                      args: { symbol }
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showStockFinancials',
                      toolCallId,
                      result: { symbol }
                    }
                  ]
                }
              ]
            })

            const caption = await generateCaption(
              symbol,
              [],
              'StockFinancials',
              aiState
            )

            return (
              <BotCard>
                <StockFinancials props={symbol} />
                {caption}
              </BotCard>
            )
          }
        },
        showStockNews: {
          description:
            'This tool shows the latest news and events for a stock or cryptocurrency.',
          parameters: z.object({
            symbol: z
              .string()
              .describe(
                'The name or symbol of the stock or currency. e.g. DOGE/PAYTM/INR.'
              )
          }),

          generate: async function* ({ symbol }) {
            yield (
              <BotCard>
                <></>
              </BotCard>
            )

            const toolCallId = nanoid()

            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showStockNews',
                      toolCallId,
                      args: { symbol }
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showStockNews',
                      toolCallId,
                      result: { symbol }
                    }
                  ]
                }
              ]
            })

            const caption = await generateCaption(
              symbol,
              [],
              'showStockNews',
              aiState
            )

            return (
              <BotCard>
                <StockNews props={symbol} />
                {caption}
              </BotCard>
            )
          }
        },
        showStockScreener: {
          description:
            'This tool shows a generic stock screener which can be used to find new stocks based on financial or technical parameters.',
          parameters: z.object({}),
          generate: async function* ({ }) {
            yield (
              <BotCard>
                <></>
              </BotCard>
            )

            const toolCallId = nanoid()

            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showStockScreener',
                      toolCallId,
                      args: {}
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showStockScreener',
                      toolCallId,
                      result: {}
                    }
                  ]
                }
              ]
            })

            const caption = await generateCaption(
              'Generic',
              [],
              'showStockScreener',
              aiState
            )

            return (
              <BotCard>
                <StockScreener />
                {caption}
              </BotCard>
            )
          }
        },
        showMarketOverview: {
          description: `This tool shows an overview of today's stock, futures, bond, and forex market performance including change values, Open, High, Low, and Close values.`,
          parameters: z.object({}),
          generate: async function* ({ }) {
            yield (
              <BotCard>
                <></>
              </BotCard>
            )

            const toolCallId = nanoid()

            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showMarketOverview',
                      toolCallId,
                      args: {}
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showMarketOverview',
                      toolCallId,
                      result: {}
                    }
                  ]
                }
              ]
            })

            const caption = await generateCaption(
              'Generic',
              [],
              'showMarketOverview',
              aiState
            )

            return (
              <BotCard>
                <MarketOverview />
                {caption}
              </BotCard>
            )
          }
        },
        showMarketHeatmap: {
          description: `This tool shows a heatmap of today's stock market performance across sectors. It is preferred over showMarketOverview if asked specifically about the stock market.`,
          parameters: z.object({}),
          generate: async function* ({ }) {
            yield (
              <BotCard>
                <></>
              </BotCard>
            )

            const toolCallId = nanoid()

            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showMarketHeatmap',
                      toolCallId,
                      args: {}
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showMarketHeatmap',
                      toolCallId,
                      result: {}
                    }
                  ]
                }
              ]
            })

            const caption = await generateCaption(
              'Generic',
              [],
              'showMarketHeatmap',
              aiState
            )

            return (
              <BotCard>
                <MarketHeatmap />
                {caption}
              </BotCard>
            )
          }
        },
        showETFHeatmap: {
          description: `This tool shows a heatmap of today's ETF performance across sectors and asset classes. It is preferred over showMarketOverview if asked specifically about the ETF market.`,
          parameters: z.object({}),
          generate: async function* ({ }) {
            yield (
              <BotCard>
                <></>
              </BotCard>
            )

            const toolCallId = nanoid()

            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showETFHeatmap',
                      toolCallId,
                      args: {}
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showETFHeatmap',
                      toolCallId,
                      result: {}
                    }
                  ]
                }
              ]
            })

            const caption = await generateCaption(
              'Generic',
              [],
              'showETFHeatmap',
              aiState
            )

            return (
              <BotCard>
                <ETFHeatmap />
                {caption}
              </BotCard>
            )
          }
        },
        showTrendingStocks: {
          description: `This tool shows the daily top trending stocks including the top five gaining, losing, and most active stocks based on today's performance`,
          parameters: z.object({}),
          generate: async function* ({ }) {
            yield (
              <BotCard>
                <></>
              </BotCard>
            )

            const toolCallId = nanoid()

            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showTrendingStocks',
                      toolCallId,
                      args: {}
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showTrendingStocks',
                      toolCallId,
                      result: {}
                    }
                  ]
                }
              ]
            })

            const caption = await generateCaption(
              'Generic',
              [],
              'showTrendingStocks',
              aiState
            )

            return (
              <BotCard>
                <MarketTrending />
                {caption}
              </BotCard>
            )
          }
        },
        showTrendlyneWidget: {
          description: `Displays a Trendlyne widget for a specific stock symbol and widget type.`,
          parameters: z.object({
            stockSymbol: z.string().describe('The stock symbol, e.g., SWIGGY'),
            widgetType: z.enum(['swot', 'technical', 'qvt', 'checklist']).describe('The type of widget to display'),
            theme: z.string().default('light').describe('The theme for the widget. Defaults to "light".'),
          }),
          generate: async function* ({ stockSymbol, widgetType, theme }) {
            yield (
              <BotCard>
                <></>
              </BotCard>
            );
        
            const toolCallId = nanoid();
        
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showTrendlyneWidget',
                      toolCallId,
                      args: { stockSymbol, widgetType, theme },
                    },
                  ],
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showTrendlyneWidget',
                      toolCallId,
                      result: { stockSymbol, widgetType, theme },
                    },
                  ],
                },
              ],
            });
        
            const caption = `This is the ${widgetType} analysis for ${stockSymbol}. Let me know if you'd like to explore another widget or more stock details.`;
        
            return (
              <BotCard>
                <TrendlyneWidget stockSymbol={stockSymbol} widgetType={widgetType} theme={theme} />
                {caption}
              </BotCard>
            );
          },
        },        
      }
    })

    return {
      id: nanoid(),
      display: result.value
    }
  } catch (err: any) {
    // Determine which API key is missing based on the flag
    const missingKey = useOpenAI ? 'OPENAI_API_KEY' : 'GROQ_API_KEY'
    if (err.message.includes(`${missingKey}`)) {
      err.message =
        `${missingKey} is missing. Pass it using the appropriate environment variable. Try restarting the application if you recently changed your environment variables.`
    }
    return {
      id: nanoid(),
      display: (
        <div className="border p-4">
          <div className="text-red-700 font-medium">Error: {err.message}</div>
          <a
            href="https://github.com/bklieger-groq/stockbot-on-groq/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-red-800 hover:text-red-900"
          >
            If you think something has gone wrong, create an
            <span className="ml-1" style={{ textDecoration: 'underline' }}>
              {' '}
              issue on Github.
            </span>
          </a>
        </div>
      )
    }
  }
}

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] }
})
