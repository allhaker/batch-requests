import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface FilesResponse {
  items: {
    id: string;
  }[];
}

type AxiosFileResponse = AxiosResponse<FilesResponse>;
type RequestResolveFn = (value: AxiosFileResponse) => void;

interface BatchRequest {
  requestPromise: Promise<AxiosFileResponse>;
  requestResolveFn: RequestResolveFn;
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

  const handleRequest = (ids: string[]): Promise<AxiosFileResponse> => {
    let requestResolveFn: RequestResolveFn | undefined;
    const requestPromise = new Promise<AxiosFileResponse>(resolve => {
      requestResolveFn = resolve;
    });

    if (!requestResolveFn) throw new Error('Internal error');

    const batchRequest: BatchRequest = {
      requestPromise,
      ids,
      requestResolveFn
    };

    if (batchRequests.length === 0) {
      batchRequests.push(batchRequest);

      setTimeout(async () => {
        const combinedIds = batchRequests.reduce<string[]>((ids, request) => {
          return ids.concat(request.ids);
        }, []);
        const uniqueCombinedIds = Array.from(new Set(combinedIds));

        const requestRes = await request<FilesResponse>(url, { params: { ids: uniqueCombinedIds } });
        const { items } = requestRes.data;

        batchRequests.forEach(savedRequest => {
          const { requestResolveFn } = savedRequest;
          const response = { ...requestRes };
          const respItems = items.filter(file => !savedRequest.ids.indexOf(file.id));
          response.data = { items: respItems };
          requestResolveFn(response);
        });

        batchRequests = [];
      }, 3000);
    } else {
      batchRequests.push(batchRequest);
    }

    return requestPromise;
  };
  return handleRequest;
};
