import React, { useCallback, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { BATCH_DUMP_TIMEOUT_MS, FilesApi } from './api-client';

const fileIds = ['fileid1', 'fileid2', 'fileid3'];

const App = () => {
  let combinedFiles: string[] | undefined;
  const [files, setFiles] = useState<string[]>([]);
  const getFiles = useCallback(FilesApi.getClientWithBatching(), []);

  const [batchInProgress, setBatchInProgress] = useState(false);

  const requestFile = useCallback(
    async (ids: string[]) => {
      setBatchInProgress(true);
      const { data } = await getFiles(ids);
      const newFiles = data.items.map(file => file.id);

      if (!combinedFiles) {
        combinedFiles = [];
      }
      combinedFiles = combinedFiles.concat(newFiles);
      setFiles(Array.from(new Set(combinedFiles)));

      setBatchInProgress(false);
    },
    [files]
  );

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h2>Let&apos;s make some batch requests</h2>
        <div>
          {fileIds.map(id => (
            <button key={id} onClick={() => requestFile([id])}>
              {id}
            </button>
          ))}
        </div>
        <p>
          Batch dump timeout is{' '}
          <u>
            <i>{BATCH_DUMP_TIMEOUT_MS} ms</i> {/* replace with const */}
          </u>
        </p>
        <p>
          Batch is in progress{' '}
          <u>
            <i>{batchInProgress.toString()}</i>
          </u>
        </p>
        <p>
          Files fetched in last request:{' '}
          {files.map(file => (
            <span key={file}>{file} </span>
          ))}
        </p>
      </header>
    </div>
  );
};

export default App;
