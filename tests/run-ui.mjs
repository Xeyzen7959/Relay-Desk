import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {mkdir,rm} from 'node:fs/promises';
await mkdir('.test-cache',{recursive:true});
await build({entryPoints:['tests/ui.test.tsx'],outfile:'.test-cache/ui-test.mjs',bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic'});
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://localhost/relaydesk/#/overview',pretendToBeVisual:true});
for(const key of ['window','document','localStorage','location','HTMLElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','Event','MouseEvent','HashChangeEvent'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
// jsdom lacks these native layout/dialog methods; semantics and click wiring are tested,
// but this is not a browser accessibility or visual-layout test.
dom.window.HTMLElement.prototype.scrollIntoView=function(){};
dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
await import('../.test-cache/ui-test.mjs');
