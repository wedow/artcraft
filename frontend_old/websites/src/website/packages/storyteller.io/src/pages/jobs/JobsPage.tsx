import React from 'react';
import { Link } from 'react-router-dom';
import { BackLink } from '@storyteller/components/src/elements/BackLink';


function JobsPage () {
  const jobsEmail = 'jobs@storyteller.io';
  return (
    <div>
      <section className="section is-small">
        <Link to="/">
          <h1 className="title is-1">
            Storyteller&nbsp;
            <figure className="image is-64x64 is-inline-block">
              <img src="/logo/storyteller_kitsune_logo_3000.png" alt="FakeYou's mascot!" />
            </figure>
          </h1>
        </Link>
        <h2 className="subtitle is-3">
          Help us build the future of production
        </h2>
      </section>

      {/*<section className="hero is-small">
        <div className="hero-body">
          <h1 className="title is-4">We're hiring!</h1>
          <p></p>
        </div>
  </section>*/}

      <section className="hero is-small">
        <div className="hero-body">
          <div className="columns is-vcentered">
            <div className="column is-one-third">
              <div className="mascot">
                <img src="/mascot/kitsune_pose7_black_2000.webp" alt="FakeYou's mascot!" />
              </div>
            </div>
            <div className="column">
              <p className="title is-3">
                We're hiring!
              </p>
              <p className="subtitle is-5">
              </p>
              <br />
              <p>
                We're going to change the world by giving every person on this planet 
                Hollywood-level live production capabilities that they can leverage 
                directly from home. They won't even need a powerful computer. Deep fakes, 
                streaming, and storytelling capabilities to rival Disney &mdash; accessible 
                from any home PC.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="hero is-small">
        <div className="hero-body">
          If our mission excites you, we'd love to have you on board. 

          We're incredibly remote-friendly, but are exceedingly happy to 
          interview candidates based in <em>Atlanta, GA.</em>, where we 
          have a huge motion capture studio / office (directly on the Beltline!), motion capture
          actors and talent, and  tons of direct, local connections to the film industry.

          <br />
          <br />

          Almost all of our stack is written in Rust, Python (PyTorch), 
          TypeScript (React), and C/C++.

          If you don't see a job that matches, keep a look out. We'll be posting additional 
          roles in the near future, including more ML and research roles.

          <br />
          <br />

          To apply for any of these positions, send your resume to <code>{jobsEmail}</code>


        </div>
      </section>

      <hr />

      <section className="hero is-small">
        <div className="hero-body">
          <div className="content">
          <h1 className="title is-3">Server Engineer</h1>

            <p>
              Since we work so directly in the signal processing and graphics domains, 
              our entire stack reflects the fact that we build for bare metal. Our web 
              services are written in Rust/Actix, which is every bit as productive as Ruby. 
              All of our code is shared in a Rust monorepo with builds orchestrated and 
              optimized with Bazel. 
            </p>

            <h1 className="title is-5">Responsibilities</h1>
            <ul>
              <li>Build a platform that empowers our community to create and upload audio, 
                video, 3D, motion, and other types of data.</li>
              <li>Build services that work together at scale to orchestrate complex workflows.</li>
            </ul>
            <h1 className="title is-5">Requirements</h1>
            <ul>
              <li>Solid grasp of the Rust programming language</li>
              <li>Solid grasp of SQL and Redis</li>
              <li>Ability to write scalable, testable code</li>
            </ul>
            <h1 className="title is-5">Nice to haves</h1>
            <ul>
              <li>Experience with any of the following: Actix, Kubernetes, Python, GCP</li>
              <li>Full stack (TypeScript/React) </li>
            </ul>

          </div>
        </div>
      </section>

      <hr />

      <section className="hero is-small">
        <div className="hero-body">
          <div className="content">
          <h1 className="title is-3">Unreal Engine Engineer</h1>

            <p>
              One of the pillars of the platform we're building is rich volumetric 
              and motion capture, composited into 3D worlds. Our community will 
              create all sorts of incredible content, and you'll have a hand in 
              directly enabling that. 
              (We won't stop until our community can surpass Disney!)
            </p>

            <h1 className="title is-5">Responsibilities</h1>
            <ul>
              <li>Map motion capture data to skeletal rigs in real time, improving collision 
                with props and other actors</li>
              <li>Dynamically load community-provided character models, props, maps, and more</li>
            </ul>
            <h1 className="title is-5">Requirements</h1>
            <ul>
              <li>Strong grasp of Unreal Engine programming in C++</li>
              <li>Strong understanding of animation and retargeting</li>
            </ul>
            <h1 className="title is-5">Nice to haves</h1>
            <ul>
              <li>Cross-platform development for Windows, Mac, and Linux</li>
              <li>Experience with networking</li>
              <li>Experience with Rust</li>
              <li>Experience with spatial computing, photogrammetry, etc.</li>
            </ul>

          </div>
        </div>
      </section>

      <section className="hero is-small">
        <div className="hero-body">
          <div className="content">
            Again, that email is <code>{jobsEmail}</code>. You made it this far. Send us your resume!
            <br />
            <br />
            <BackLink link="/" />
          </div>
        </div>
      </section>



    </div>
  );
}

export default JobsPage;
