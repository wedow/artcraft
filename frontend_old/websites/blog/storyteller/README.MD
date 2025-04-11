# ZOLA BLOG README

Zola is a SSG (static site generator) written in Rust, however, you do not need to know any Rust programming to do the development work on this. It is more important to understand the [Tera Templates](https://keats.github.io/tera/) and its particualr syntax for templating and markdown editing.

So, to start:-

## The BASICS
### Installation

#### On Mac

Using `brew` is probably the easiest
```sh
$ brew install zola
```

#### On Windows
Using `winget` is probably the easiest
```sh
$ winget install getzola.zola
```

For Other systems, please refer to Zola's [Installation Guide](https://www.getzola.org/documentation/getting-started/installation/).

### Running the Development
This project consist of Tailwind CSS, which is a module on npm, so firstly, install and build Tailwind
```sh
$ yarn        # this installs the module according to the package.json
$ yarn dev    # this build and serve the css files with live reload
```
Then, at the root of this project, simply run.
```sh
$ zola serve
```
This builds and serves the blog at `http://localhost:1111`, it also provide **live-reloading** for a more convenient development workflow as well.

### Building the Deployment
At the root of this project, simply run.
```sh
$ yarn build    # this builds the css files
$ zola build    # this builds the entire package
```
At the end, this compiles everthing into the `public` folder, and this `public` folder is ready for a static site deployment.

#### Dry Running the Deployment
You may want to do a dry run on the deployment build, one of the easiest ways is to use python's simple http serve
```sh
$ cd public
$ python -m SimpleHTTPServer 9000
# if you have the latest python install you can also run 
$ python3 -m http.server 9000
```
This serves the static files on `http://localhost:9000`, you can change the port number it something else is already running on `9000`.

The above commands are the same in `serve_publc.sh`, for your convenience, you can simply run this file instead.

## DEVELOPMENT

### File Structure


```sh
/
├── config.toml            # Configuration file for SSG 
│
├── content/               # Directory for all MD files
│   │
│   ├── blog/              # A Section of the Generated Site
│   │   ├── _index.md      # The Blog-roll of a section, aka the section page
│   │   ├── first.md       # Every other MD file is a post in the section
│   │   └── second/        # If a post have many files, it's better to use a directory
│   │       ├── index.md   # The MD file of the post must be named index.md
│   │       └── image.jpg  # e.g, the post has an image, it can be placed in its directory
│   ⋮
│   └── news/              # There could be many sections, they take have any name you give its directory
│
├── public/               # Output folder, ignored by Git
│
├── static/               # All the static assets that's used by the template
│
└── templates/            # All the template files are in the template directory
    │                     # The following are some important files
    │  
    │                     # Zola Defaults
    ├── index.html        # The default template for /content/_index.md, unused by our project
    ├── page.html         # The default template for any blog post page
    ├── section.html      # The default template for any section page
    │
    │                          # Templates pages of less priority
    ├── 404.html               # The default template for 404 page
    ├── taxonomy_list.html     # The default template for tags page, iow, show all tags
    ├── taxonomy_single.html   # The default template for a tag's page, iow, show all post with a certain tag
    │
    │                     # Other that is Important for our template
    ├── base.html         # Base template that's shared among all templates
    ├── partials/         # HTML partials that are reused in different templates
    └── shortcodes/       # HTML partials that are used in MD files to go beyond basic MD rendering, 
                          # such as youtubes embeds, etc,
```

## POST Writing, iow, MD Specifications

WIP m(_ _)m Let me cook please.

