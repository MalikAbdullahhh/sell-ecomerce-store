import app from "./app.js";

const PORT = process.env.PORT || 5000;
// lol hahah
// lkijuhgfghjkl
/** Local / long-running Node process entry. Vercel uses api/index.js instead. */
app.listen(PORT, () => {
  console.log(`Aperture API listening on http://localhost:${PORT}`);
});
