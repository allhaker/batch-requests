import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

const WAIT_TIMEOUT_MS = 3000;

const apiConfig = { BATCH_DUMP_TIMEOUT_MS: 1, BATCH_URL: '/file-batch-api' };
jest.mock('./api-client/consts', () => apiConfig);

describe('App component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('fetches and displays files correctly', async () => {
    const { getByText, container } = render(<App />);
    const getIsInProgress = () => getByText('Batch is in progress', { exact: false });

    // Click on all 3 buttons
    const files = ['fileid1', 'fileid2', 'fileid3'];

    expect(getIsInProgress().textContent).toContain('false');
    files.forEach(file => fireEvent.click(getByText(file)));
    expect(getIsInProgress().textContent).toContain('true');

    const getfileSpans = () => container.querySelectorAll('span');
    await waitFor(
      () => {
        const elements = getfileSpans();
        if (elements.length === 0) throw new Error();
      },
      { timeout: WAIT_TIMEOUT_MS }
    );
    expect(getIsInProgress().textContent).toContain('false');

    // Verify that the fetched files are displayed correctly
    const filesText = getByText('Files fetched in last request:');
    expect(filesText).toBeInTheDocument();

    const fileSpans = getfileSpans();
    fileSpans.forEach(fileSpan => expect(files.indexOf(String(fileSpan.textContent?.trim()))).not.toBe(-1));
  });

  test('displays error message on file fetch error', async () => {
    apiConfig.BATCH_URL = 'broken';

    const { getByText } = render(<App />);

    // Click on the first file button
    const fileButton = getByText('fileid1');
    fireEvent.click(fileButton);

    // Wait for the error message to be displayed
    const getErrorElement = () => getByText('Error occured', { exact: false });
    await waitFor(getErrorElement), { timeout: WAIT_TIMEOUT_MS };

    // Verify that correct the error message is displayed
    const errorElement = getErrorElement();
    expect(errorElement.textContent).toContain('Network Error');
  });
});
