import React, { useCallback, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { ApiClient } from './api-client';

const BATCH_URL = '/file-batch-api';
const fileIds = ['fileid1', 'fileid2', 'fileid3'];

interface FilesResponse {
  items: {
    id: string;
  }[];
}

// doing it all in one file
// will indicate what could have been split into files
const App = () => {
  const [files, setFiles] = useState<string[]>([]);

  const requestFile = useCallback(
    async (ids: string[]) => {
      const { data } = await ApiClient.get<FilesResponse>(BATCH_URL, { params: { ids } });
      data.items.forEach(file => {
        if (!files.includes(file.id)) {
          const newFiles = [...files, file.id];
          setFiles(newFiles);
        }
      });
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
          Files fetched so far:{' '}
          {files.map(file => (
            <span key={file}>{file} </span>
          ))}
        </div>
      </header>
    </div>
  );
};

export default App;
