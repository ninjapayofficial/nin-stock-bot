// // /lib/chat/tools/search.ts
// import axios from 'axios';
// import cheerio from 'cheerio';

// export async function performSearch(query: string): Promise<{ urls: string[]; summary: string }> {
//   try {
//     const apiKey = process.env.SERP_API_KEY; // Store your SERP API key in the environment
//     const endpoint = `https://google.serper.dev/search`; // https://google.serper.dev/search // https://serpapi.com/search.json

//     const response = await axios.get(endpoint, {
//       params: {
//         q: query,
//         hl: 'en',
//         gl: 'in',
//         api_key: apiKey,
//       },
//     });

//     const searchResults = response.data.organic || [];  // Use "response.data.organic" for serper.dev and "response.data.organic_results" for https://serpapi.com/search.json
//     console.log("Response data:", response.data);
//     const urls = searchResults.map((result: any) => result.link).slice(0, 3); // Get top 3 URLs
//     console.log("urls:", urls);

//     return {
//       urls,
//       summary: urls.length
//         ? urls.map((url: any, index: number) => `${index + 1}. ${url}`).join('\n')
//         : 'No results found.',
//     };
//   } catch (error) {
//     console.error('SERP API Search Error:', error);
//     return { urls: [], summary: 'Failed to perform search. Please try again later.' };
//   }
// }

// async function fetchWithRetries(url: string, retries = 3) {
//     for (let attempt = 1; attempt <= retries; attempt++) {
//         try {
//             const response = await axios.get(url, {
//                 headers: {
//                     'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
//                 },
//             });
//             return response.data;
//         } catch (error: any) {
//             console.error(`Attempt ${attempt} failed:`, error.message);
//             if (attempt === retries) throw error;
//             await new Promise(res => setTimeout(res, 1000 * attempt)); // Exponential backoff
//         }
//     }
// }

// export async function scrapeWebPage(url: string): Promise<string> {
//     try {
//         const html = await fetchWithRetries(url);
//         if (!html) throw new Error('No HTML content retrieved.');

//         const $ = cheerio.load(html);
//         const content = $('body').text();
//         const cleanedContent = content.replace(/\s+/g, ' ').trim();
//         console.log('Scraped content:', cleanedContent.slice(0, 100)); // Preview content
//         return cleanedContent.slice(0, 3000);
//     } catch (error) {
//         console.error('Scraping Error:', error);
//         return 'Failed to extract content from the webpage. Please try again later.';
//     }
// }

// // export async function scrapeWebPage(url: string): Promise<string> {
// //   try {
// //     const response = await axios.get(url, {
// //       headers: {
// //         'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
// //       },
// //     });

// //     const html = response.data;
// //     const $ = cheerio.load(html);

// //     // Extract main content from the webpage
// //     const content = $('body').text(); // Simplest approach
// //     const cleanedContent = content.replace(/\s+/g, ' ').trim();
// //     console.log("cleanedContent:", cleanedContent);

// //     return cleanedContent.slice(0, 3000); // Limit size based on AI token capacity
// //   } catch (error) {
// //     console.error('Scraping Error:', error);
// //     return 'Failed to extract content from the webpage. The URL might be inaccessible.';
// //   }
// // }




// // // Tool Use for /actions.tsx page
// // showSearchResults: {
// //     description: `Search the web for information, extract content from top results, and analyze it.`,
// //     parameters: z.object({
// //       query: z.string().describe('The search query string, e.g., "latest news on stock market".'),
// //     }),
// //     generate: async function* ({ query }) {
// //       yield (
// //         <BotCard>
// //           <></>
// //         </BotCard>
// //       );
  
// //       const toolCallId = nanoid();
  
// //       aiState.done({
// //         ...aiState.get(),
// //         messages: [
// //           ...aiState.get().messages,
// //           {
// //             id: nanoid(),
// //             role: 'assistant',
// //             content: [
// //               {
// //                 type: 'tool-call',
// //                 toolName: 'showSearchResults',
// //                 toolCallId,
// //                 args: { query },
// //               },
// //             ],
// //           },
// //           {
// //             id: nanoid(),
// //             role: 'tool',
// //             content: [
// //               {
// //                 type: 'tool-result',
// //                 toolName: 'showSearchResults',
// //                 toolCallId,
// //                 result: { query },
// //               },
// //             ],
// //           },
// //         ],
// //       });
  
// //       // Step 1: Perform search
// //       const { urls, summary } = await performSearch(query);
  
// //       if (!urls.length) {
// //         return (
// //           <BotCard>
// //             <div>{summary}</div>
// //           </BotCard>
// //         );
// //       }
  
// //       // Step 2: Scrape content from the top URLs
// //       let aggregatedContent = '';
// //       for (const url of urls) {
// //         const content = await scrapeWebPage(url);
// //         aggregatedContent += `\nContent from ${url}:\n${content}\n`;
// //       }
  
// //       // Step 3: Analyze and answer the query using the aggregated content
// //       const analysisPrompt = `
// //   You are an AI that analyzes web content. Here's the content extracted from multiple webpages:
  
// //   "${aggregatedContent}"
  
// //   Answer the following question based on this content:
// //   "${query}"
// //       `;
  
// //       const modelResponse = await generateText({
// //         model: openAIProvider(OPENAI_MODEL),
// //         messages: [
// //           { role: 'system', content: analysisPrompt },
// //         ],
// //       });
  
// //       return (
// //         <BotCard>
// //           <div>
// //             <strong>Search Results:</strong>
// //             <pre>{summary}</pre>
// //             <strong>Answer:</strong>
// //             <p>{modelResponse.text || 'Unable to analyze the content.'}</p>
// //           </div>
// //         </BotCard>
// //       );
// //     },
// //   }, // Tool end           