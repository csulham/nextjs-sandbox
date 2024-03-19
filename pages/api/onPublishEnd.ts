// Import the Next.js API route handler
import { NextApiRequest, NextApiResponse } from 'next';
import { graphqlRequest, GraphQLRequest } from '@/util/GraphQLQuery';

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
        console.log('Getting GQL Data for item ' + guid);
        // Invoke the GraphQL query with the request
        const result = await graphqlRequest(request);

        console.log('Item Data:\n' + JSON.stringify(result));

        // TODO: Handle the result of the GraphQL query
        // 1. Make sure we got some data from GQL
        // 2. Check if it's in the right site (the webhook fires for every site) by comparing the path
        // 3. Send the json data to the Yext Push API endpoint

      } catch (error) {
        // If an error occurs while invoking the GraphQL query, return a 500 error
        return res.status(500).json({ message: 'Internal Server Error: GraphQL query failed' })
      }
    }
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