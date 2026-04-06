import { BrowserRouter as Router } from 'react-router-dom'
import './App.css'
import Pages from "@/pages/index.jsx"
import { AuthProvider } from "@/AuthContext"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Pages />
          <SonnerToaster position="top-right" expand={false} richColors closeButton />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App 