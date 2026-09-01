import { Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Toaster } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import StoryReader from "./pages/StoryReader";

function AppRoutes() {
  return <Switch><Route path="/" component={Home} /><Route path="/truyen/:slug" component={StoryReader} /><Route path="/admin" component={Admin} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><Toaster position="bottom-right" toastOptions={{ style: { borderRadius: "14px" } }} /><Router hook={useHashLocation}><AppRoutes /></Router></ThemeProvider></ErrorBoundary>;
}
