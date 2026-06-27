import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Forms from "./pages/Forms";
import CopyAcioli from "./pages/CopyAcioli";
import Admin from "./pages/Admin";
import AdminDorks from "./pages/AdminDorks"; // Import the new component
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/forms" element={<Forms />} />
          <Route path="/copyacioli" element={<CopyAcioli />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/dorks" element={<AdminDorks />} /> {/* Add the new route */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;