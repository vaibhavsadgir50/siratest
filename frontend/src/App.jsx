import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage.jsx'
import { RestChatPage } from './pages/RestChatPage.jsx'
import { SiraChatPage } from './pages/SiraChatPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat/sira" element={<SiraChatPage />} />
        <Route path="/chat/rest" element={<RestChatPage />} />
      </Routes>
    </BrowserRouter>
  )
}
