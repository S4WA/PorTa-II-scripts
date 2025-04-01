// ==UserScript==
// @name        PortaII_NeverTimeOut
// @namespace   PortaII NeverTimeOut
// @match       https://dreams.dokkyo.ac.jp/*
// @exclude     https://dreams.dokkyo.ac.jp/campusweb/campussquare.do?*
// @grant       none
// @version     1.1
// @author      XTC
// @description Never ever timeout again.
// @downloadURL https://gist.githubusercontent.com/S4WA/8716cf448bc21c6c1e5ff8fed92224f3/raw/
// @icon        https://www.google.com/s2/favicons?sz=64&domain=www.dokkyo.ac.jp
// ==/UserScript==
const prefix = `[${GM_info.script.name} v${GM_info.script.version}]`;
console.log(prefix, 'Script Loaded.');

setInterval(function() {
  let el = $("#portaltimer");
  if (el.length == 0) return;
  el.click();
//   console.log(prefix, 'Clicked.');
}, 1000*60*2);