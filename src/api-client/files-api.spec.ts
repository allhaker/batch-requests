import { ApiClient } from './api-client';
import { FilesApi } from './files-api';

const apiConfig = { BATCH_DUMP_TIMEOUT_MS: 1, BATCH_URL: '/file-batch-api' };
jest.mock('./consts', () => apiConfig);

jest.mock('./api-client', () => ({
  ApiClient: {
    get: jest.fn()
  }
}));

const defaultFiles = ['fileid1', 'fileid2', 'fileid3'];

describe('Files API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should handle batch request with many params via 1 batch request', async () => {
    const fileIds = [...defaultFiles];
    const mockFilesResponse = {
      data: {
        items: fileIds.map(id => ({ id }))
      }
    };
    const getFiles = FilesApi.getClientWithBatching();
    const mockGet = ApiClient.get as jest.Mock;
    mockGet.mockResolvedValueOnce(mockFilesResponse);

    const requestPromise = getFiles(fileIds);

    // Wait for the batch request to be resolved
    const response = await requestPromise;
    expect(mockGet).toBeCalledTimes(1);

    // Assert that the response contains the expected files
    const respFiles = response.data.items;
    respFiles.forEach(file => expect(fileIds.indexOf(file.id)).not.toBe(-1));
    expect(respFiles).toHaveLength(3);
  });

  test('should handle batch request where one file is not returned', async () => {
    const fileIds = [...defaultFiles];
    const mockFilesResponse = {
      data: {
        items: [
          { id: 'fileid1' },
          { id: 'fileid3' } // One file is missing in the response
        ]
      }
    };
    const getFiles = FilesApi.getClientWithBatching();
    const mockGet = ApiClient.get as jest.Mock;
    mockGet.mockResolvedValueOnce(mockFilesResponse);

    const requestPromise = getFiles(fileIds);

    // Wait for the batch request to be resolved
    const response = await requestPromise;
    expect(mockGet).toBeCalledTimes(1);

    // Assert that the response contains the expected files
    const respFiles = response.data.items;
    expect(respFiles).toHaveLength(2);
    expect(respFiles[0].id).toBe('fileid1');
    expect(respFiles[1].id).toBe('fileid3');
  });

  test('should handle batch request but there is an error in the actual request', async () => {
    const fileIds = [...defaultFiles];
    const mockErrorResponse = new Error('Failed to fetch files');
    const getFiles = FilesApi.getClientWithBatching();
    const mockGet = ApiClient.get as jest.Mock;
    mockGet.mockRejectedValueOnce(mockErrorResponse);

    const requestPromise = getFiles(fileIds);

    // Wait for the batch request to be resolved
    await expect(requestPromise).rejects.toThrow('Failed to fetch files');
    expect(mockGet).toBeCalledTimes(1);
  });

  test('should handle batch request with separate requests', async () => {
    const fileIds = [...defaultFiles];
    const mockFilesResponse = {
      data: {
        items: fileIds.map(id => ({ id }))
      }
    };
    const getFiles = FilesApi.getClientWithBatching();
    const mockGet = ApiClient.get as jest.Mock;

    mockGet.mockResolvedValueOnce(mockFilesResponse);

    // Make the batch requests
    const requestPromises = fileIds.map(fileId => getFiles([fileId]));

    // Wait for all the batch requests to be resolved
    const responses = await Promise.all(requestPromises);
    expect(mockGet).toBeCalledTimes(1);

    // Assert that the responses contain the expected files
    responses.forEach((response, index) => {
      const respFiles = response.data.items;
      expect(respFiles).toHaveLength(1);
      expect(respFiles[0].id).toBe(fileIds[index]);
    });
  });

  test('should handle batch request with separate requests but one file is not returned', async () => {
    const fileIds = [...defaultFiles];
    const mockFilesResponse = {
      data: {
        items: [
          { id: 'fileid1' },
          { id: 'fileid3' } // One file is missing in the response
        ]
      }
    };
    const getFiles = FilesApi.getClientWithBatching();
    const mockGet = ApiClient.get as jest.Mock;

    mockGet.mockResolvedValueOnce(mockFilesResponse);

    // Make the batch requests
    const requestPromises = fileIds.map(fileId => getFiles([fileId]));

    // Wait for all the batch requests to be resolved
    const responses = await Promise.all(requestPromises);
    expect(mockGet).toBeCalledTimes(1);

    // Assert that the responses contain the expected files
    responses.forEach((response, index) => {
      if (index !== 1) {
        const respFiles = response.data.items;
        expect(respFiles).toHaveLength(1);
        expect(respFiles[0].id).toBe(fileIds[index]);
      } else {
        expect(response.data.items).toHaveLength(0); // one response should be empty
      }
    });
  });

  test('should handle batch request with separate requests but there is an error in the actual request', async () => {
    const fileIds = [...defaultFiles];
    const mockErrorResponse = new Error('Failed to fetch files');
    const getFiles = FilesApi.getClientWithBatching();
    const mockGet = ApiClient.get as jest.Mock;

    mockGet.mockRejectedValueOnce(mockErrorResponse);

    // Make the batch requests
    const requestPromises = fileIds.map(fileId => getFiles([fileId]));

    // Wait for all the batch requests to be resolved
    await expect(Promise.all(requestPromises)).rejects.toThrow('Failed to fetch file');
    expect(mockGet).toBeCalledTimes(1);
  });

  test('should handle batch request with separate requests but fileId1 is fetched many times', async () => {
    // we will call some fileId1 multiple times
    const fileIds = [...defaultFiles, defaultFiles[0], defaultFiles[0]];
    const mockFilesResponse = {
      data: {
        items: defaultFiles.map(id => ({ id }))
      }
    };
    const getFiles = FilesApi.getClientWithBatching();
    const mockGet = ApiClient.get as jest.Mock;

    mockGet.mockResolvedValueOnce(mockFilesResponse);

    // Make the batch requests
    const requestPromises = fileIds.map(fileId => getFiles([fileId]));

    // Wait for all the batch requests to be resolved
    const responses = await Promise.all(requestPromises);
    expect(mockGet).toBeCalledTimes(1);

    // Assert that the responses contain the expected files
    expect(responses).toHaveLength(fileIds.length);
    responses.forEach((response, index) => {
      const respFiles = response.data.items;
      expect(respFiles).toHaveLength(1);
      expect(respFiles[0].id).toBe(fileIds[index]);
    });
  });

  test('should handle batch request with separate requests after batch dump timeout hit', async () => {
    const fileIds = [...defaultFiles];
    const mockFilesResponse = {
      data: {
        items: fileIds.map(id => ({ id }))
      }
    };
    const getFiles = FilesApi.getClientWithBatching();
    const mockGet = ApiClient.get as jest.Mock;

    const executeTest = async (repetition: number) => {
      mockGet.mockResolvedValueOnce(mockFilesResponse);

      // Make the batch requests
      const requestPromises = fileIds.map(fileId => getFiles([fileId]));

      // Wait for all the batch requests to be resolved
      const responses = await Promise.all(requestPromises);
      expect(mockGet).toBeCalledTimes(repetition);

      // Assert that the responses contain the expected files
      responses.forEach((response, index) => {
        const respFiles = response.data.items;
        expect(respFiles).toHaveLength(1);
        expect(respFiles[0].id).toBe(fileIds[index]);
      });
    };

    // execute test first, then wait and execute again.
    // get function should be called twice but otherwise should work the same
    await executeTest(1);
    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 100);
    });
    await executeTest(2);
  });
});
