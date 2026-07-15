import { useState } from 'react'
// import { HashRouter as Router, Routes, Route } from 'react-router-dom'
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// const queryClient = new QueryClient();// Create React Query manager
import Navbar from './components/layout/Navbar';

function App() {

  return (
    <>
      <Navbar />

      <QueryClientProvider client={QueryClient}>

        <Router>
          <div className="flex flex-col min-h-screen bg-gray-50" >

            <Navbar />
            <main className="flex-grow pt-20">

              <Routes>

                <Route path='/' element={<Home />} />
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />
                <Route path='/joblist' element={<Joblist />} />

                <Route path='/jobDetails' element={<JobDetails />} />
                <Route path='/companies' element={<Companies />} />
                <Route path='/Resource' element={<Resource />} />
                <Route path='/Resume-builder' element={<Resumebuilder />} />
                <Route path='/dashboard ' element={<Dashboard />} />
                <Route path='/profile' element={<profile />} />
                <Route path='/createjob' element={<CreateJob />} />
              </Routes>
            </main>
            <footer />
          </div>
        </Router>

        <Toaster position="top-right" />

      </QueryClientProvider>


    </>
  )
}


export default App
