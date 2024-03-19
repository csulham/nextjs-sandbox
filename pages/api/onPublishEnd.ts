// Import the Next.js API route handler
import { NextApiRequest, NextApiResponse } from 'next';
import { graphqlRequest, GraphQLRequest } from '@/util/GraphQLQuery';
import { GetDate } from '@/util/GetDate';

// Define the API route handler
export default async function onPublishEnd(req: NextApiRequest, res: NextApiResponse) {
  // Check if the api_key query parameter matches the WEBHOOK_API_KEY environment variable
  if (req.query.api_key !== process.env.WEBHOOK_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // If the request method is not POST, return an error
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let data;
  try {
    // Try to parse the JSON data from the request body
    //console.log('Req body:\n' + JSON.stringify(req.body));
    data = req.body;
  } catch (error) {
    console.log('Bad Request: ', error);
    return res.status(400).json({ message: 'Bad Request. Check incoming data.' });
  }

  const items = [];

  // Loop over all the entries in updates
  for (const update of data.updates) {
    // Check if the entity_definition is LayoutData
    if (update.entity_definition === 'LayoutData') {
      // Extract the GUID portion of the identifier
      const guid = update.identifier.split('-')[0]

      try {
        // Create the GraphQL request
        const request: GraphQLRequest = {
          query: itemQuery,
          variables: { id: guid },
        };
        
        // Invoke the GraphQL query with the request
        //console.log(`Getting GQL Data for item ${guid}`);
        const result = await graphqlRequest(request);
        //console.log('Item Data:\n' + JSON.stringify(result));

        // Make sure we got some data from GQL in the result
        if (!result || !result.item) {
            console.log(`No data returned from GraphQL for item ${guid}`);
            continue;
          }
  
          // Check if it's in the right site by comparing the item.path
          if (!result.item.path.startsWith('/sitecore/content/Search Demo/Search Demo/')) {
            console.log(`Item ${guid} is not in the right site`);
            continue;
          }

          // Add the item to the items array
          items.push(result.item)
        
      } catch (error) {
        // If an error occurs while invoking the GraphQL query, return a 500 error
        return res.status(500).json({ message: 'Internal Server Error: GraphQL query failed' })
      }
    }
  }
 // Send the json data to the Yext Push API endpoint
 const pushApiEndpoint = `${process.env.YEXT_PUSH_API_ENDPOINT}?v=${GetDate()}&api_key=${process.env.YEXT_PUSH_API_KEY}`;
 console.log(`Pushing to ${pushApiEndpoint}\nData:\n${JSON.stringify(items)}`);
 
 // Send all the items to the Yext Push API endpoint
 const yextResponse = await fetch(pushApiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(items),
  });

  if (!yextResponse.ok) {
    console.log(`Failed to push data to Yext: ${yextResponse.status} ${yextResponse.statusText}`);
  }

  // Send a response
  return res.status(200).json({ message: 'Webhook event received' })
}

const itemQuery = `
query ($id: String!) {
    item(path: $id, language: "en") {
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
  
`;