import type { NextApiRequest, NextApiResponse } from 'next';
import { GetDate } from '@/util/GetDate';

type ResponseData = {
  message: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  try {
    if (!req) {
      return;
    }

    // Decode the query params to the parameter structure
    const incomingParams: YextSearchParams = {
      contentTypes: req.query.contenttypes?.toString() ?? '',
      locations: req.query.locations?.toString() ?? '',
      topics: req.query.topics?.toString() ?? '',
      page: parseInt(req.query.page as string) ?? 0,
      numResults: parseInt(req.query.numResults as string) ?? 9,
      sort: req.query.sort?.toString() ?? '',
    };

    //console.log('Yext Query Incoming params: \n' + JSON.stringify(incomingParams));

    if (isNaN(incomingParams.numResults) || incomingParams.numResults < 1) {
      // Ensure this is a number, otherwise set to 9.
      incomingParams.numResults = 9;
    }

    // Get the page number param, if it exists
    if (isNaN(incomingParams.page) || incomingParams.page < 1) {
      // Ensure this is a number, otherwise default to first page.
      incomingParams.page = 0;
    } else {
      incomingParams.page = incomingParams.page - 1;
    }

    const yextApiUrl =
      process.env.YEXT_QUERY_API_ENDPOINT ?? 'https://api.yextapis.com/v2/accounts/me/entities';

    // Parse the taxonomy filters into a Yext entity filter json structure
    const filter = GetYextFiltersFromUrlParams(incomingParams);
    //console.log('filter param=' + filter);

    // Build the sort clause
    const sort = incomingParams.sort ? `[{${YextFieldNames.sortDate}:${incomingParams.sort}}]` : '';

    const yextQueryParams = {
      filter: filter ? filter : '{}',
      entityTypes: 'ce_sitecore_page', // Hardcoded to query only Sitecore crawled content
      api_key: process.env.YEXT_API_KEY,
      limit: incomingParams.numResults,
      offset: incomingParams.numResults * incomingParams.page, // Calculate the offset for pagination
      sortBy: sort,
      v: GetDate(),
    };
    console.log(`Yext query params:\n${JSON.stringify(yextQueryParams)}`);

    // Construct the query string
    const queryString = Object.entries(yextQueryParams)
      .map(([key, value]) => `${key}=${encodeURIComponent((value ?? '').toString())}`)
      .join('&');

    const requestUri = `${yextApiUrl}?${queryString}`;
    console.log('Yext Entity API request uri: ' + requestUri);

    const response = await (await fetch(requestUri)).json();
    //console.log('RESPONSE from Yext Entity API Query', response?.response);
    res.status(200).json(response?.response);
  } catch (err) {
    console.log('ERROR during Yext Entity API Query', err);
  } finally {
  }
}

function GetYextFiltersFromUrlParams(req: YextSearchParams): string {
  const taxonomyClauses = [];

  // Create all the taxonomy clauses from the parameters
  taxonomyClauses.push(GetTaxonomyFilterClause('c_contentType', req.contentTypes));
  taxonomyClauses.push(GetTaxonomyFilterClause('c_locations', req.locations));
  taxonomyClauses.push(GetTaxonomyFilterClause('c_topic', req.topics));

  // Filter out empty clauses and combine them within the 'and' clause
  const filter = taxonomyClauses.filter((s) => s).join(',');
  if (filter) {
    return `{"$and":[${filter}]}`;
  }
  return '';
}

function GetTaxonomyFilterClause(name: string, values?: string): string {
  // validate the parameters
  if (!name || !values) {
    return '';
  }
  // Try to split values on comma so we properly put quotes around the listed filters
  const valueArray = values.split(',');

  const filterClause = {
    [name]: {
      $in: valueArray,
    },
  };
  //console.log(`Clause for ${name}: ${JSON.stringify(filterClause)}`);
  return JSON.stringify(filterClause);
}

/**
 * @description Data structure that should be serialized into URL query parameters for a Yext entities API search.
 * Page parameter starts at 1.
 * Num results defaults to 9 unless specified.
 * Taxonomy filters, such as topics, must be comma separated names of taxonomies, not guids. *
 * Correct:   params.Topics = 'Money,Retirement'
 * Incorrect: params.Topics = '{AC5AB52E-0319-4166-9847-B31CC071CA7E},{C4FA9F40-8CE1-4725-B180-13EC9E09D21F}'
 */
export type YextSearchParams = {
  contentTypes?: string;
  locations?: string;
  topics?: string;
  page: number;
  numResults: number;
  sort: string;
};

export enum YextSortDirection {
  Ascending = 'ASCENDING',
  Descending = 'DESCENDING',
}

enum YextFieldNames {
  sortDate = 'c_displayDate',
}