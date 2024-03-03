var _=(c,i,s)=>{if(!i.has(c))throw TypeError("Cannot "+s)};var u=(c,i,s)=>(_(c,i,"read from private field"),s?s.call(c):i.get(c)),L=(c,i,s)=>{if(i.has(c))throw TypeError("Cannot add the same private member more than once");i instanceof WeakSet?i.add(c):i.set(c,s)},w=(c,i,s,f)=>(_(c,i,"write to private field"),f?f.call(c,s):i.set(c,s),s);(async()=>{var a;(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))r(e);new MutationObserver(e=>{for(const o of e)if(o.type==="childList")for(const l of o.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&r(l)}).observe(document,{childList:!0,subtree:!0});function t(e){const o={};return e.integrity&&(o.integrity=e.integrity),e.referrerPolicy&&(o.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?o.credentials="include":e.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(e){if(e.ep)return;e.ep=!0;const o=t(e);fetch(e.href,o)}})();async function c(n){const t=await chrome.storage.sync.get(n);return JSON.parse(t[n]??null)}async function i(n,t){await chrome.storage.sync.set({[n]:JSON.stringify(t)})}async function s(){return(await chrome.tabs.query({active:!0}))[0]}async function f(n){return(await chrome.tabs.query({url:n}))[0]}async function U(n){chrome.tabs.update(n,{active:!0})}async function v(n,t){chrome.tabs.update(n,{url:t})}function g(n){return document.querySelector(n)}const h="notes";class x{constructor(t){L(this,a,void 0);w(this,a,t)}get notes(){return u(this,a)}async addNote(t){u(this,a).push(t),await i(h,u(this,a))}async removeNote(t){const r=u(this,a).findIndex(o=>o.id===t),e=u(this,a).slice();e.splice(r,1),w(this,a,e),await i(h,u(this,a))}async noteObjectFromUrl(t){const[r,e]=t.split(":~:text=");if(!r||!e)return null;const o=await T(t)??(await s()).title??"";return{id:crypto.randomUUID(),sourceTitle:o,sourceUrl:t,text:decodeURIComponent(e)}}}a=new WeakMap;const $=await c(h)??[],d=new x($);function p(){const n=g(".note-list");if(n.innerHTML="",!d.notes.length)n.innerHTML="No notes yet.";else{const t=new DocumentFragment;d.notes.forEach(r=>{const e=document.createElement("div");e.className="note",e.id=r.id;const o=document.createElement("a");o.className="note__link",o.href=r.sourceUrl,o.target="_blank",o.innerHTML=`
				<span class="note__link__source" title="${r.sourceTitle}">${r.sourceTitle}</span>
				<span class="note__link__text">${r.text}</span>
			`,o.onclick=async I=>{I.preventDefault();const D=k(o.href),b=await f(D);b&&await U(b.id);const y=await s();if(O(o.href,y.url??"")){const N=new URL(o.href);await v(y.id,N.href),chrome.scripting.executeScript({target:{tabId:y.id},func:function(R){window.location.hash=R},args:[N.hash]})}else console.log("opening...",o.href),window.open(o.href)};const l=document.createElement("button");l.className="button note__delete",l.tabIndex=-1,l.textContent="\u2A2F",l.onclick=async()=>{await d.removeNote(r.id),p()},e.append(o,l),t.append(e)}),n.append(t)}}function k(n){const t=new URL(n);return`${t.origin}${t.pathname}*`}function O(n,t){const r=new URL(n),e=new URL(t);return`${r.origin}${r.pathname}`==`${e.origin}${e.pathname}`}async function T(n){const t=await fetch(n).then(e=>e.text()).catch(()=>null);if(!t)return null;const r=t.match(/<title>.*<\/title>/iu);return r?r[0].replace(/<[\/]?title>/giu,"").trim()??null:null}const m=g("#note-form"),E="h-url";m.onsubmit=async n=>{n.preventDefault();const t=new FormData(m).get(E),r=await d.noteObjectFromUrl(t);r&&(d.addNote(r),m.hidden=!0,m.reset(),p())},p()})();