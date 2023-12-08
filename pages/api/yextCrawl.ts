import type { NextApiRequest, NextApiResponse } from 'next'

type ResponseData = {
  message: string
}
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {  
  try {
    if (!req) {
      return;
    }
    const cursor = req.query['cursor'];
    console.log('Cursor param=' + cursor);
/*
    const simpleQuery= `
      query SimpleQuery{
        layout(site: "suncoast", routePath: "/", language: "en") {
          item {
            rendered
          }
        }
      }
    `;
*/
    const crawlQuery = `
      query YextSiteCrawl(
          $numResults: Int
          $after: String
          $rootItem: String!
          $hasLayout: String!
          $noIndex: Int
      ) {
          search(
          where: {
              AND: [
              { name: "_path", value: $rootItem, operator: EQ }
              { name: "_hasLayout", value: $hasLayout }
              { name: "noIndex", value: $noIndex, operator: NEQ }
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
 
    const headers = {
      'content-type': 'application/json',
      'sc_apikey': process.env.SUNCOAST_DEV_API_KEY ?? ''
    };
    //console.log('api key=' + process.env.SUNCOAST_DEV_API_KEY)
    //console.log('Header ' + JSON.stringify(headers));

    const requestBody = {
      query: crawlQuery,
      variables: { 
        "numResults" : 10,
        "after" : cursor ?? "",
        "rootItem": "{1E411842-1C89-4016-AEF2-EF80CCFABFE6}",
        "hasLayout": "true",
        "noIndex": 1
       }
    };
    console.log('Request Body\n '+ JSON.stringify(requestBody));
    const options = {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    };

    const response = await (await fetch('https://edge.sitecorecloud.io/api/graphql/v1', options)).json();
    console.log('RESPONSE FROM FETCH REQUEST', response?.data);
    res.status(200).json(response?.data);
  }
  catch (err) {
    console.log('ERROR DURING FETCH REQUEST', err);
  }
  finally {
    
  }
};