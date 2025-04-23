import { Route, Routes } from "react-router-dom";
import Landing from "../pages/landing";
import Download from "../pages/download";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

export function App() {
  return (
    <div className="relative">
      <Navbar />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/download" element={<Download />} />
      </Routes>

      <Footer />
    </div>
  );
}

export default App;
