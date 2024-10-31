import { useState, useEffect, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { v4 as uuidv4 } from 'uuid';

interface IncomingFile {
  file: ArrayBuffer;
  name: string;
}

const FileShare = () => {
  const [peerId, setPeerId] = useState<string>('');
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [connectedPeerId, setConnectedPeerId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [notification, setNotification] = useState<string>('');
  const [incomingFile, setIncomingFile] = useState<IncomingFile | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  const peerRef = useRef<Peer | null>(null);

  useEffect(() => {
    const peer = new Peer(uuidv4(), {
      host: 'localhost',
      port: 3000,
      path: '/peerjs/peerjs',
    });
    peerRef.current = peer;

    peer.on('open', (id: string) => setPeerId(id));

    peer.on('connection', (conn: DataConnection) => {
      conn.on('open', () => {
        setConnection(conn);
        setStatus('Connected to peer');
      });

      conn.on('data', handleIncomingData);

      conn.on('close', () => {
        setConnection(null);
        setStatus('Disconnected');
      });
    });

    return () => {
      peer.destroy();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const connectToPeer = () => {
    const conn = peerRef.current?.connect(connectedPeerId);
    conn?.on('open', () => {
      setConnection(conn);
      setStatus(`Connected to peer ${connectedPeerId}`);
    });
    conn?.on('data', handleIncomingData);
    conn?.on('close', () => {
      setConnection(null);
      setStatus('Disconnected');
    });
  };

  const sendFile = () => {
    if (file && connection) {
      const reader = new FileReader();
      reader.onload = () => {
        connection.send({ file: reader.result, name: file.name });
        setNotification(`Sent file: ${file.name}`);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleIncomingData = (data: any) => {
    if (data.file) {
      setIncomingFile({ file: data.file, name: data.name });
      setShowModal(true);
    } else if (data.status === 'disconnect') {
      handleDisconnect();
    }
  };

  const acceptFile = () => {
    if (incomingFile) {
      setNotification(`Received file: ${incomingFile.name}`);
      const blob = new Blob([incomingFile.file]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = incomingFile.name;
      a.click();
      setShowModal(false);
    }
  };

  const declineFile = () => {
    if (connection && incomingFile) {
      setNotification(`File transfer failed`);
      connection.send({ status: 'declined', name: incomingFile.name });
      setShowModal(false);
    }
  };

  const handleDisconnect = () => {
    if (connection) {
      connection.send({ status: 'disconnect' });
      connection.close();
      setConnection(null);
      setStatus('Disconnected');
      setNotification('Disconnected from peer');
    }
  };

  useEffect(() => {
    if (connection) {
      connection.on('data', (data: any) => {
        if (data.status === 'declined') {
          setNotification(`File transfer failed: ${data.name} was declined`);
        }
      });
    }
  }, [connection]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Peer-to-Peer File Sharing</h1>
      <div className="text-lg mb-2">Your Peer ID: {peerId}</div>
      <div className="text-lg mb-2 text-green-500">{status}</div>
      <div className="text-lg mb-2 text-blue-500">{notification}</div>

      {!connection && (
        <>
          <input
            type="text"
            placeholder="Enter Peer ID to connect"
            value={connectedPeerId}
            onChange={(e) => setConnectedPeerId(e.target.value)}
            className="border p-2 mb-2"
          />
          <button
            onClick={connectToPeer}
            className="bg-blue-500 text-white p-2 rounded mb-4"
          >
            Connect
          </button>
        </>
      )}
      {connection && (
        <>
          <input type="file" onChange={handleFileChange} className="mb-2" />
          <button
            onClick={sendFile}
            disabled={!file || !connection}
            className="bg-green-500 text-white p-2 rounded mb-4"
          >
            Send File
          </button>

          <button
            onClick={handleDisconnect}
            className="bg-red-500 text-white p-2 rounded"
          >
            Disconnect
          </button>
        </>
      )}

      {showModal && incomingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-2">Incoming File</h2>
            <p className="mb-4">File: {incomingFile.name}</p>
            <button
              onClick={acceptFile}
              className="bg-green-500 text-white p-2 rounded mr-2"
            >
              Accept
            </button>

            <button
              onClick={declineFile}
              className="bg-red-500 text-white p-2 rounded"
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileShare;
