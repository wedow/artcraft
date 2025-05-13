import { Route, Routes } from "react-router-dom";
import Download from "../pages/download";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import Landing2 from "../pages/landing2";

export function App() {
  return (
    <div className="relative">
      <Navbar />

      <Routes>
        <Route path="/" element={<Landing2 />} />
        <Route path="/download" element={<Download />} />
      </Routes>

      <Footer />
    </div>
  );
}

export default App;
