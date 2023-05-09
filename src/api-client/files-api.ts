import { AxiosResponse } from 'axios';
import { BATCH_DUMP_TIMEOUT_MS, BATCH_URL } from './consts';
import { ApiClient } from './api-client';

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
  requestRejectFn: RequestResolveFn;
  ids: string[];
}

const getClientWithBatching = () => {
  let batchRequests: BatchRequest[] = [];

  const getBatchRequest = (ids: string[]) => {
    let requestResolveFn: RequestResolveFn | undefined;
    let requestRejectFn: RequestResolveFn | undefined;
    const requestPromise = new Promise<AxiosFileResponse>((resolve, reject) => {
      requestResolveFn = resolve;
      requestRejectFn = reject;
    });

    if (!requestResolveFn || !requestRejectFn) throw new Error('Application Internal error');

    return {
      requestPromise,
      ids,
      requestResolveFn,
      requestRejectFn
    };
  };

  const getCombinedBatchIds = () => {
    const combinedIds = batchRequests.reduce<string[]>((ids, request) => {
      return ids.concat(request.ids);
    }, []);
    return Array.from(new Set(combinedIds));
  };

  const resolvePendingPromises = (ids: string[]) =>
    getFiles(ids)
      .then(res => {
        batchRequests.forEach(savedRequest => {
          const { requestResolveFn } = savedRequest;
          const response = { ...res };
          const respItems = res.data.items.filter(file => savedRequest.ids.indexOf(file.id) !== -1);
          response.data = { items: respItems };
          requestResolveFn(response);
        });
      })
      .catch(e => {
        batchRequests.forEach(savedRequest => {
          const { requestRejectFn } = savedRequest;
          requestRejectFn(e);
        });
      });

  const startBatchdDumpTimerAndProcessing = () => {
    setTimeout(async () => {
      const combinedIds = getCombinedBatchIds();
      await resolvePendingPromises(combinedIds);
      batchRequests = [];
    }, BATCH_DUMP_TIMEOUT_MS);
  };

  const handleBatchRequest = (ids: string[]) => {
    const batchRequest = getBatchRequest(ids);
    if (batchRequests.length === 0) {
      batchRequests.push(batchRequest);
      startBatchdDumpTimerAndProcessing();
    } else {
      batchRequests.push(batchRequest);
    }

    return batchRequest.requestPromise;
  };
  return handleBatchRequest;
};

const getFiles = (ids: string[]) => {
  return ApiClient.get<FilesResponse>(BATCH_URL, { params: { ids } });
};

export const FilesApi = {
  getFiles,
  getClientWithBatching
};
