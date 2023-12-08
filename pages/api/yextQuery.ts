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
    const filter = req.query['filter']?.toString();
    console.log('filter param=' + filter);

    console.log('api key=' + process.env.YEXT_SANDBOX_API_KEY);

    const yextApiUrl = 'https://api.yextapis.com/v2/accounts/me/entities';
    const yextApiParams = {
        filter : filter ? decodeURIComponent(filter) : '{}',
        entityTypes : 'ce_blogPost',
        api_key: process.env.YEXT_SANDBOX_API_KEY, 
        v: GetDate()
    }
    // Construct the query string from the parameters
    const queryString = Object.entries(yextApiParams)
        .map(([key, value]) => `${key}=${encodeURIComponent((value ?? '').toString())}`)
        .join('&')
    

    const requestUri = `${yextApiUrl}?${queryString}`;
    console.log('Request uri: ' + requestUri);
    
    const response = await (await fetch(requestUri)).json();
    console.log('RESPONSE FROM FETCH REQUEST', response?.response);
    res.status(200).json(response?.response);
  }
  catch (err) {
    console.log('ERROR DURING FETCH REQUEST', err);
  }
  finally {
    
  }
};

function GetDate() : string
{
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = today.getMonth() + 1; // Months start at 0!
    var dd = today.getDate();
    var MM = mm.toString();
    var DD = dd.toString();

    if (dd < 10) {
        DD = '0' + dd;
    }

    if (mm < 10) {
        MM = '0' + mm;
    }

    return yyyy + MM + DD;
}