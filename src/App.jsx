import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import LoanCalculator from './pages/LoanCalculator'
import UnderwriterSummary from './pages/UnderwriterSummary'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoanCalculator />} />
        <Route path="/underwriter-summary" element={<UnderwriterSummary />} />
        <Route path="*" element={<div className="flex items-center justify-center h-screen text-xl text-muted-foreground">404 – Page not found</div>} />
      </Routes>
    </Router>
  )
}

export default App
