import { Navigate, Route, Routes, useParams } from "react-router-dom";
import CreatedPage from "./pages/CreatedPage.jsx";
import CreatePage from "./pages/CreatePage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import MoreInfoPage from "./pages/MoreInfoPage.jsx";
import RevealPage from "./pages/RevealPage.jsx";

// App is the top-level route table for the frontend.
// Each Route connects a URL path to the page component React should render.
export default function App() {
  return (
    <Routes>
      {/* Static routes match exact pages like / and /create. */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/create" element={<CreatePage />} />

      {/* Dynamic routes use :id to read a MongoDB invite id from the URL. */}
      <Route path="/created/:id" element={<CreatedPage />} />
      <Route path="/t/:id" element={<RevealPage />} />
      <Route path="/t/:id/reveal" element={<LegacyRevealRedirect />} />
      <Route path="/t/:id/more" element={<MoreInfoPage />} />
    </Routes>
  );
}

function LegacyRevealRedirect() {
  const { id } = useParams();
  return <Navigate replace to={`/t/${id}`} />;
}
