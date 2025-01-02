// // /lib/chat/tools/search.ts
// import axios from 'axios';

// export async function performSearch(query: string): Promise<{ answer: string; urls: string[]; summary: string }> {
//   try {
//     const apiKey = process.env.SERP_API_KEY; // Store your SERP API key in the environment
//     const endpoint = `https://google.serper.dev/search`;

//     const response = await axios.post(
//       endpoint,
//       { q: query, hl:'en', gl: 'in'},
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'X-API-KEY': apiKey,
//         },
//       }
//     );

//     // const response = await axios.get(endpoint, {
//     //   params: {
//     //     q: query,
//     //     hl: 'en',
//     //     gl: 'in',
//     //     api_key: apiKey,
//     //   },
//     // });

//     console.log('Response data:', response.data);

//     const answerBox = response.data.answerBox || {};
//     const organicResults = response.data.organic || [];

//     const answer = answerBox.snippet || 'No direct answer found.';
//     const urls = organicResults.map((result: any) => result.link).slice(0, 3);

//     return {
//       answer,
//       urls,
//       summary: urls.length
//         ? urls.map((url: any, index: number) => `${index + 1}. ${url}`).join('\n')
//         : 'No results found.',
//     };
//   } catch (error) {
//     console.error('Search Error:', error);
//     return { answer: '', urls: [], summary: 'Failed to perform search. Please try again later.' };
//   }
// }
