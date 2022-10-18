/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
require("dotenv").config();

const fetch = require("node-fetch");
const path = require("path");
const express = require("express");

const app = express();
const port = process.env.PORT || 8005;

const Prismic = require("@prismicio/client");
const PrismicH = require("@prismicio/helpers");

// Initialize the prismic.io api
const initApi = (req) => {
  return Prismic.createClient(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    req,
    fetch,
  });
};

// Link Resolver
const HandleLinkResolver = (doc) => {
  // Define the url depending on the document type
  //   if (doc.type === 'page') {
  //     return '/page/' + doc.uid;
  //   } else if (doc.type === 'blog_post') {
  //     return '/blog/' + doc.uid;
  //   }

  // Default to homepage
  return "/";
};

// Middleware to inject prismic context
app.use((req, res, next) => {
  res.locals.ctx = {
    endpoint: process.env.PRISMIC_ENDPOINT,
    linkResolver: HandleLinkResolver,
  };
  res.locals.PrismicH = PrismicH;

  next();
});

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.locals.basedir = app.get("views");

const handleRequest = async (api) => {
  const [about] = await Promise.all([api.getSingle("about")]);

  const assets = [];

  about.data.gallery.forEach((item) => {
    assets.push(item.image.url);
  });

  about.data.body.forEach((section) => {
    if (section.slice_type === "gallery") {
      section.items.forEach((item) => {
        assets.push(item.image.url);
      });
    }
  });

  return {
    assets,
    about,
  };
};

app.get("/", async (req, res) => {
  res.render("pages/home");
});

app.get("/about", async (req, res) => {
  const api = await initApi(req);
  const defaults = await handleRequest(api);
  console.log(defaults)

  res.render("pages/about", {
    ...defaults,
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
