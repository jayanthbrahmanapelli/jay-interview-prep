import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import DayPage from './pages/DayPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/day/:id" element={<DayPage />} />
      </Routes>
    </BrowserRouter>
  )
}
