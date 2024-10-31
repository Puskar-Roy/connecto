import { Route, Routes } from 'react-router-dom';
import Home from './components/home/Home';
import FileShare from './components/fileshare/FileShare';
import RandomChat from './components/chat/RandomChat';



function App() {
  return (
    <main >

      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/chat' element={<RandomChat />} />
        <Route path='/share' element={<FileShare />} />
      </Routes>

    </main>
  );
}

export default App;
