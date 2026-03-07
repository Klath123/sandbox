import { BrowserRouter as Routerz_Hehe, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react'
import Home from './pages/Home';
import Navbar from './components/navbar';
import './App.css'
import Auth from './pages/Auth';
import Playground from './pages/Playground';
import Playground2 from './pages/Playground2';
import Playground3 from './pages/Playground3';
import Playground4 from './pages/Playground4';

function App() {

  return (
    <>
      <Routerz_Hehe >

        <header className="">
          {/* <Navbar /> */}
        </header>
        <Routes className='mt-16'>
          <Route path='/' element={<Home />} />
          <Route path='/auth' element={<Auth />} />
          <Route path='/playground' element={<Playground />} />
          <Route path='/playground2' element={<Playground2 />} />
          <Route path='/playground3' element={<Playground3 />} />
          <Route path='/playground4' element={<Playground4 />} />
          <Route path='*' element={<div className='text-center text-gray-600'>404</div>} />
        </Routes>

      </Routerz_Hehe>
    </>
  )
}

export default App
