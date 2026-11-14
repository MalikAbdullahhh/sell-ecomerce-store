// Workers-safe stand-in for morgan (the real one compiles formats with new Function, which Workers forbid).
export default function morgan() {
  return (req, res, next) => {
    const t = Date.now();
    res.on("finish", () => console.log(`${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${Date.now() - t}ms`));
    next();
  };
}
