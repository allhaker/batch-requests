import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface FilesResponse {
  items: {
    id: string;
  }[];
}

interface BatchRequest {
  incomingRequest: any;
  resolveFn: any;
  ids: string[];
}

export const ApiClient = axios.create({
  baseURL: 'https://europe-west1-quickstart-1573558070219.cloudfunctions.net'
});

export const withBatching = (
  request: <T>(url: string, config?: AxiosRequestConfig<T>) => Promise<AxiosResponse<T>>,
  url: string
) => {
  let batchRequests: BatchRequest[] = [];

  const handleRequest = (ids: string[]): Promise<AxiosResponse<FilesResponse>> => {
    let resolveFn: any;
    const returnPromise = new Promise(resolve => {
      resolveFn = resolve;
    });
    const incomingRequest: BatchRequest = {
      incomingRequest: returnPromise,
      ids,
      resolveFn
    };

    if (batchRequests.length === 0) {
      batchRequests.push(incomingRequest);

      setTimeout(async () => {
        const combinedIds = batchRequests.reduce<string[]>((ids, request) => {
          return ids.concat(request.ids);
        }, []);
        const uniqueCombinedIds = Array.from(new Set(combinedIds));

        const requestRes = await request<FilesResponse>(url, { params: { ids: uniqueCombinedIds } });
        const { items } = requestRes.data;

        batchRequests.forEach(savedRequest => {
          const { resolveFn } = savedRequest;
          const response = { ...requestRes };
          const respItems = items.filter(file => !savedRequest.ids.indexOf(file.id));
          response.data = { items: respItems };
          resolveFn(response);
        });

        batchRequests = [];
      }, 3000);
    } else {
      batchRequests.push(incomingRequest);
    }

    return returnPromise as any;
  };
  return handleRequest;
};
