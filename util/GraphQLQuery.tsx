import fetch from 'node-fetch';

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
}

// Define the expected shape of the GraphQL response data
interface GraphQLResponse {
  data?: any;
  errors?: { message: string }[];
}

export async function graphqlRequest(request: GraphQLRequest): Promise<any> {
  const endpoint = process.env.GRAPH_QL_ENDPOINT ?? '';
  const apiKey = process.env.SITECORE_API_KEY ?? '';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'sc_apikey': apiKey
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  // Type the body variable using the GraphQLResponse interface
  const body  = await response.json() as GraphQLResponse;

  if (body.errors) {
    throw new Error(`GraphQL request failed: ${body.errors.map(error => error.message).join(', ')}`);
  }

  return body.data;
}
