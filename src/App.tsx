import React, { useCallback, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { ApiClient, withBatching } from './api-client';

const BATCH_URL = '/file-batch-api';
const fileIds = ['fileid1', 'fileid2', 'fileid3'];

// fix text
// add is loading gif

const App = () => {
  let combinedFiles: string[] | undefined;

  const [files, setFiles] = useState<string[]>([]);
  const getFiles = useCallback(withBatching(ApiClient.get, BATCH_URL), []);

  const requestFile = useCallback(
    async (ids: string[]) => {
      const { data } = await getFiles(ids);
      const newFiles = data.items.map(file => file.id);

      if (!combinedFiles) {
        combinedFiles = [];
      }
      combinedFiles = combinedFiles.concat(newFiles);
      setFiles(Array.from(new Set(combinedFiles)));
    },
    [files]
  );

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Let&apos;s make some batch requests</p>
        <div>
          {fileIds.map(id => (
            <button key={id} onClick={() => requestFile([id])}>
              {id}
            </button>
          ))}
        </div>
        <p>
          You request will be sent in:{' '}
          <u>
            <i>5000 ms</i>
          </u>
        </p>
        <div>
          Files fetched in last request:{' '}
          {files.map(file => (
            <span key={file}>{file} </span>
          ))}
        </div>
      </header>
    </div>
  );
};

export default App;
