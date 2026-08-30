// Applies the saved CRT level to <html> before first paint, so the page never
// flashes the wrong intensity. Loaded as a classic blocking script from the
// document head — deliberately not a module, since modules are deferred and
// would run too late.
//
// This was an inline <script> until the Content-Security-Policy went in: an
// inline script needs either 'unsafe-inline' or a hash that has to be kept in
// sync with the markup from inside the nginx config. A one-line file costs a
// revalidation request and needs neither.
try {
  document.documentElement.dataset.crt = localStorage.getItem("crt") || "on";
} catch (e) {
  // private mode, or storage disabled entirely
  document.documentElement.dataset.crt = "on";
}
