# Surface: route-level form result region

src/components/surface.tsx ('use client'):
- Surface({ continuation?, render?, className?, children }) wraps children in a continuation context and renders `render` element (cloneElement with children) or a div;
- useSurfaceContinuation(explicit?) returns explicit ?? nearest Surface value;
- Surface knows nothing about ACL. `render` is the extension seam: pass <Acl need=… /> there later and Surface will clone it with the forms as children.
Route pages: <Surface continuation={rw.actionResult} render={<main .../>}>…forms…</Surface>. Forms read the value via the hook; explicit prop wins.
Verified without JS: signup error and success now render visibly (before, SignupCard received nothing).