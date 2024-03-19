import type { NextApiRequest, NextApiResponse } from 'next';
import { graphqlRequest, GraphQLRequest } from '@/util/GraphQLQuery';

type ResponseData = {
  message: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    if (!req) {
      return;
    }
    // Check the API key
    if (req.query['api_key'] != process.env.YEXT_CRAWL_API_KEY) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    // Pull the page cursor from the query params
    const cursor = req.query['cursor'];

    const rootItem = req.query['root'] ?? process.env.YEXT_CRAWL_ROOT_ITEM;

    const headers = {
      'content-type': 'application/json',
      sc_apikey: process.env.SITECORE_API_KEY ?? '',
    };
    //console.log('Yext Crawl- Request Header\n ' + JSON.stringify(headers));

    const requestBody: GraphQLRequest = {
      query: crawlQuery,
      variables: {
        numResults: 10,
        after: cursor ?? '',
        rootItem: rootItem,
        hasLayout: 'true'
      },
    };

    const response = await graphqlRequest(requestBody);    
    
    console.log('Yext Crawl- Response:', response);
    
    res.status(200).json(response);
  } catch (err) {
    console.log('ERROR during Yext Crawl request:', err);
  } finally {
  }
}

const crawlQuery = `
      query YextSiteCrawl(
          $numResults: Int
          $after: String
          $rootItem: String!
          $hasLayout: String!
      ) {
          search(
          where: {
              AND: [
                { name: "_path", value: $rootItem, operator: EQ }
                { name: "_hasLayout", value: $hasLayout }
              ]
          }
          first: $numResults
          after: $after
          ) {
          total
          pageInfo {
              endCursor
              hasNext
          }
          results {
              id
              name
              path
              url {
                path
                url
              }
              fields {
                name
                jsonValue
              }
          }
        }
      }
  `;