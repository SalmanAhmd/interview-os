function e(r){const t=r.trim();return t?/^https?:\/\//i.test(t)?t:/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(t)?`https://${t}`:null:null}export{e};
