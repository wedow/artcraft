// import 'bulma/css/bulma.css'
import "./App.scss";

import React, { useRef } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import IndexPage from "./pages/index/IndexPage";
import VoxelCamPage from "./pages/voxelcam/VoxelCamPage";
import JobsPage from "./pages/jobs/JobsPage";
import { LocomotiveScrollProvider } from "react-locomotive-scroll";
import { TopNav } from "./common/TopNav";
import { Footer } from "./common/Footer";

function App() {
  const containerRef = useRef(null);

  return (
    <>
      <LocomotiveScrollProvider
        options={{
          smooth: true,
          multiplier: 0.9,
          getDirection: true,
          scrollFromAnywhere: true,
          mobile: {
            smooth: false,
          },
          // ... all available Locomotive Scroll instance options
        }}
        watch={
          [
            //..all the dependencies you want to watch to update the scroll.
            //  Basicaly, you would want to watch page/location changes
            //  For exemple, on Next.js you would want to watch properties like `router.asPath` (you may want to add more criterias if the instance should be update on locations with query parameters)
          ]
        }
        containerRef={containerRef}
      >
        <BrowserRouter>
          <div data-scroll-container ref={containerRef} id="scroller">
            <div>
              <TopNav />
              <Switch>
                <Route path="/voxelcam">
                  <VoxelCamPage />
                </Route>
                <Route path="/jobs">
                  <JobsPage />
                </Route>
                <Route exact={true} path="/">
                  <IndexPage />
                </Route>
              </Switch>
              <Footer />
            </div>
          </div>
        </BrowserRouter>
      </LocomotiveScrollProvider>
    </>
  );
}

export default App;
