// SXnlZlCGNJKEZ5y6Mcc7jZV00O9I5EfnvPycVxD/sObA1evoij+L1nnULDw5sji3qTPsnAN8KB1YGoykMkxS6Zy//SPHbiY45rsmIZxbLJunv/AosoDFZCkj9LtecEHMhGQD+Rs20VczV/N2ErChC/Kjd9EsFip8sNUafvho4Fas+bCE8FhyCdQasvlCXhk269w/KPRpTiFbkUkEOAR4YP7OZjJsSUHLRyrjBEcKmlyn0G3zAujJBmQHF1xhIKCTc8hAtwrBh2ogm1XPwMLQHCd9yEskSy4gf1zll3nby4XBMGiwhvYW9fmbD2dpGZKd0VGPsLfXC5rv5oVvk1+YCA==
/**
 ** Copyright (C) 2000-2020 Opera Software AS.  All rights reserved.
 **
 ** This file is part of the Opera web browser.
 **
 ** This script patches sites to work better with Opera
 ** For more information see http://www.opera.com/docs/browserjs/
 **
 ** If you have comments on these patches (for example if you are the webmaster
 ** and want to inform us about a fixed site that no longer needs patching)
 ** please report issues through the bug tracking system
 ** https://bugs.opera.com/
 **
 ** DO NOT EDIT THIS FILE! It will not be used by Opera if edited.
 **
 ** BROWSERJS_TIMESTAMP = '202111261910'; // for versioning; see DNA-54964
 **/
 'use strict';

 if (!location.href.includes('operabrowserjs=no')) {
     (function(document) {
         const { href, pathname, hostname } = location;
 
         /*
           We make references to the following functions to not get version that
           users
           have overwritten.
         */
         const setTimeout = window.setTimeout;
         const call = Function.prototype.call;
         const copyMethod = (method, ...defaultArgs) => {
             method.call = call;
             return (...args) => {
                 if (defaultArgs.length) {
                     args = defaultArgs.concat(args);
                 }
                 return method.call(...args);
             };
         };
 
         const addEventListener = copyMethod(Window.prototype.addEventListener);
         const appendChild = copyMethod(Node.prototype.appendChild);
         const createElement = copyMethod(Document.prototype.createElement);
         const createTextNode =
             copyMethod(Document.prototype.createTextNode, document);
         const setAttribute = copyMethod(Element.prototype.setAttribute);
         const querySelector = copyMethod(Document.prototype.querySelector);
         const querySelectorElement = copyMethod(Element.prototype.querySelector);
 
         const version = () => {
             const total = Object.keys(PATCHES).length;
             /* eslint-disable max-len */
             return `Opera OPRDesktop 28.0 core 1750.0, November 26, 2021. Active patches: ${total}`;
             /* eslint-enable max-len */
         };
 
         const log = text => {
             /* eslint-disable max-len, no-console */
             console.log(
                 `Opera has modified script or content on ${hostname} (${text}). See browser.js for details`);
             /* eslint-enable max-len, no-console */
         };
 
         const isPartOfDomain = host =>
             hostname.endsWith(`.${host}`) || hostname === host;
         const hideOperaObject = () => {
             delete window.opr;
         };
         const hideOperaUserAgent = () => {
             const newUA = navigator.userAgent.replace(/ ?OPR.[0-9.]*.*/, '');
             Object.defineProperty(window.navigator, 'userAgent', { get: () => newUA });
         };
         const hideServiceWorker = () => {
             delete Navigator.prototype.serviceWorker;
         };
 
         const addCssToDocument = (cssText, doc = document, mediaType = '') => {
             addCssToDocument.styleObj = addCssToDocument.styleObj || {};
             let styles = addCssToDocument.styleObj[mediaType];
             if (!styles) {
                 const head = querySelector(doc, 'head');
                 if (!head) {
                     // head always present in html5-parsers, assume document not ready
                     addEventListener(doc, 'DOMContentLoaded', () => {
                         addCssToDocument(cssText, doc, mediaType);
                     }, false);
                     return;
                 }
                 styles = createElement(doc, 'style');
                 addCssToDocument.styleObj[mediaType] = styles;
                 setAttribute(styles, 'type', 'text/css');
                 if (mediaType) {
                     setAttribute(styles, 'media', mediaType);
                 }
                 appendChild(styles, createTextNode(' '));
                 appendChild(head, styles);
             }
             styles.firstChild.nodeValue += `${cssText}\n`;
             return true;
         };
 
         const PATCHES = {
             'PATCH-1190': {
                 description: 'Delta.com shows browser warning to Opera 25',
                 isMatching: () => isPartOfDomain('delta.com'),
                 apply: () => {
                     let value;
                     Object.defineProperty(window, 'UnsupportedBrowser', {
                         get: () => value,
                         set: arg => {
                             arg.badBrowser = () => false;
                             value = arg;
                         },
                     });
                 },
             },
             'PATCH-1220': {
                 description: 'pretend to be Chrome on talkgadget to not force ' +
                     'plugin download.',
                 isMatching: () => hostname.includes('.google.') &&
                     hostname.startsWith('talkgadget'),
                 apply: () => hideOperaUserAgent(),
             },
             'PATCH-1228': {
                 description: 'block for delta-homes com spam site',
                 isMatching: () => isPartOfDomain('delta-homes.com'),
                 apply: () => location.replace('https://google.com'),
             },
             'PATCH-1252': {
                 description: 'hide first-run overlay on read.amazon.com',
                 isMatching: () => isPartOfDomain('read.amazon.com'),
                 apply: () => {
                     addCssToDocument([
                         '.ui-dialog.firstRunDialog, ',
                         '.ui-dialog.firstRunDialog + .ui-widget-overlay ',
                         '{visibility:hidden}',
                     ].join(''));
                 },
             },
             'PATCH-1263': {
                 description: 'hide Unsupported Browser dialog on clarks.co.uk',
                 isMatching: () => isPartOfDomain('clarks.co.uk'),
                 apply: () => {
                     addCssToDocument('#unsupportedBrowser {visibility:hidden}');
                 },
             },
             '1': {
                 description: 'Browser.js status and version reported on browser.js ' +
                     'documentation page',
                 isMatching: () => isPartOfDomain('opera.com') &&
                     pathname.startsWith('/docs/browserjs/'),
                 applyOnDOMReady: true,
                 apply: () => {
                     const bjElement = querySelector(document, '#browserjs_active');
                     const bjMessage =
                         querySelector(document, '#browserjs_status_message');
                     if (bjElement) {
                         const bjElementChild = querySelectorElement(bjElement, 'span');
                         if (bjElementChild) {
                             bjElement.style.display = '';
                             appendChild(bjElementChild, createTextNode(version()));
                             if (bjMessage) {
                                 bjMessage.style.display = 'none';
                             }
                         }
                     }
                 },
             },
             'PATCH-1269': {
                 description: 'Hide Chrome ad from Google pages',
                 isMatching: () => hostname.startsWith('images.google.') ||
                     hostname.startsWith('www.google.'),
                 applyOnDOMReady: true,
                 apply: () => {
                     const href =
                         'https://www.google.com/url?q=/chrome/browser/desktop/';
                     const res = document.evaluate(
                         `//a[contains(@href, "${href}")]`, document, null,
                         XPathResult.ANY_TYPE, null);
                     const downloadLink = res.iterateNext();
                     if (downloadLink) {
                         const ad = downloadLink.closest('div[role="dialog"]');
                         if (ad) {
                             ad.style.display = 'none';
                         }
                     }
                 },
             },
             'PATCH-1277': {
                 description: 'hide Unsupported Browser label on otvetmail',
                 isMatching: () => isPartOfDomain('otvet.mail.ru'),
                 apply: () => {
                     addCssToDocument('#tb-39754319 {visibility:hidden}');
                     addCssToDocument('#tb-54288097 {visibility:hidden}');
                     addCssToDocument('#tb-54288098 {visibility:hidden}');
                     addCssToDocument('#tb-54288094 {visibility:hidden}');
                     addCssToDocument('#tb-54288099 {visibility:hidden}');
                     addCssToDocument('#tb-54288095 {visibility:hidden}');
                     addCssToDocument('#tb-54288093 {visibility:hidden}');
                     addCssToDocument('#tb-32116366 {visibility:hidden}');
                 },
             },
             'DNA-69435': {
                 description: 'Hide Yandex ad from yandex search results',
                 isMatching: () => hostname.startsWith('yandex') &&
                     pathname.startsWith('/search/'),
                 apply: () => {
                     addCssToDocument('.popup2.distr-popup {visibility: hidden;}');
                 },
             },
             'DNA-69613': {
                 description: 'hide Unsupported Browser label on tickets.oebb.at',
                 isMatching: () => isPartOfDomain('tickets.oebb.at'),
                 apply: () => {
                     addCssToDocument('#settingErr {visibility:hidden}');
                 },
             },
             'DNA-72852': {
                 description: 'Pretend to be Chrome on streamdb3web',
                 isMatching: () => isPartOfDomain(
                     'streamdb3web.securenetsystems.net/cirrusencore/DEMOSTN'),
                 apply: () => hideOperaUserAgent(),
             },
             'DNA-85788': {
                 description: 'Pretend to be Chrome on russian rt',
                 isMatching: () => isPartOfDomain('russian.rt.com'),
                 apply: () => {
                     addCssToDocument('div#offers.offers {visibility:hidden}');
                 }
             },
             'DNA-84005': {
                 description: 'Pretend to be Chrome on mwcbarcelona',
                 isMatching: () => isPartOfDomain('comba-telecom.com'),
                 apply: () => {
                     hideOperaObject();
                     hideOperaUserAgent();
                 },
             },
             'DNA-79464': {
                 description: 'Pretend to be Chrome on cbs',
                 isMatching: () => isPartOfDomain('cbs.com'),
                 apply: () => {
                     hideOperaObject();
                     hideOperaUserAgent();
                 },
             },
             'DNA-85812': {
                 description: 'Pretend to be Chrome on vk.com',
                 isMatching: () => isPartOfDomain('vk.com'),
                 apply: () => {
                     addCssToDocument('div#system_msg.fixed {visibility:hidden}');
                 }
             },
             'DNA-83244': {
                 description: 'Pretend to be Chrome on mailCom',
                 isMatching: () => isPartOfDomain('mail.com'),
                 apply: () => {
                     addCssToDocument('div.mod.mod-topper.promo {visibility:hidden}');
                 },
             },
             'DNA-85510': {
                 description: 'Pretend to be Chrome on famemma.tv',
                 isMatching: () => isPartOfDomain('famemma.tv'),
                 apply: () => {
                     hideOperaObject();
                     hideOperaUserAgent();
                 },
             },
             'DNA-90739': {
                 description: 'Help to get form information for Opera users',
                 isMatching: () => isPartOfDomain('opera.atlassian.net') &&
                     (pathname.startsWith('/servicedesk/customer/portal/9') ||
                     pathname.startsWith('/servicedesk/customer/portal/18') ||
                     pathname.startsWith('/servicedesk/customer/portal/20')),
                 applyOnDOMReady: true,
                 apply: async() => {
                     const findElement = selector => new Promise(resolve => {
                         setTimeout(() => resolve(querySelector(document, selector)), 100);
                     });
                     const waitForElement = async selector => {
                         for (let i = 0; i < 50; i++) {
                             const element = await findElement(selector);
                             if (element) {
                                 return element;
                             }
                         }
                         return null;
                     };
                     const setInputValue = (input, value) => {
                         const descriptor = Object.getOwnPropertyDescriptor(input, 'value');
                         let event = document.createEvent('UIEvents');
                         event.initEvent('focus', false, false);
                         input.dispatchEvent(event);
                         input.value = value + '!';
                         var desc = Object.getOwnPropertyDescriptor(input, 'value');
                         if (desc && desc.configurable) {
                             delete input.value;
                         }
                         input.value = value;
                         event = document.createEvent('HTMLEvents');
                         event.initEvent('propertychange', false, false);
                         event.propertyName = 'value';
                         input.dispatchEvent(event);
                         event = document.createEvent('HTMLEvents');
                         event.initEvent('input', true, false);
                         input.dispatchEvent(event);
                         if (descriptor) {
                             Object.defineProperty(input, 'value', descriptor);
                         }
                     };
 
                     const insertValueToInput = async(selector, value) => {
                         const inputElement = await waitForElement(selector);
                         if (inputElement) {
                             setTimeout(() => setInputValue(inputElement, value), 500);
                         }
                     };
 
                     const getGpuInformation = () => {
                         const gl = document.createElement('canvas').getContext('webgl');
                         if (!gl) {
                           return '';
                         }
                         const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                         if (debugInfo) {
                           return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                         }
                         return '';
                     };
 
                     const insertSystemInformation = () => {
                         insertValueToInput(
                             '#customfield_10072',
                             `${navigator.userAgent} (${navigator.language}), ${getGpuInformation()}`);
                     };
 
                     if (pathname.includes(
                             'servicedesk/customer/portal/9/group/11/create/') ||
                             pathname.includes(
                                 'servicedesk/customer/portal/18/group/32/create/')) {
                         insertSystemInformation();
                     }
 
                     const originalPushState = history.pushState;
                     history.pushState = function(...args) {
                         insertSystemInformation();
                         originalPushState.apply(history, args);
                     };
                 },
             },
             'DNA-90251': {
                 description: 'change Add to Chrome to Add to Opera',
                 isMatching: () => isPartOfDomain('chrome.google.com') &&
                     pathname.startsWith('/webstore/'),
                 apply: () => {
                     const targetNode = document.documentElement;
                     const config = { attributes: true, childList: true, subtree: true };
                     const callback = function(mutationsList, observer) {
                         for (const mutation of mutationsList) {
                             if (mutation.type === 'childList') {
                                 var webstoreButtons =
                                     document.querySelectorAll('.webstore-test-button-label');
                                 for (let webstoreButton of webstoreButtons) {
                                     if (webstoreButton.innerHTML.includes('Chrome')) {
                                         webstoreButton.innerHTML =
                                             webstoreButton.innerHTML.replace('Chrome', 'Opera');
                                     }
                                 }
                             }
                         }
                     };
                     const observer = new MutationObserver(callback);
                     observer.observe(targetNode, config);
                 },
                 applyOnDOMReady: true,
             },
         };
 
         for (let key in PATCHES) {
             const { isMatching, apply, description, applyOnDOMReady } = PATCHES[key];
             if (isMatching()) {
                 const run = () => {
                     apply();
                     log(`${key}, ${description}`);
                 };
 
                 if (applyOnDOMReady) {
                     addEventListener(document, 'DOMContentLoaded', run, false);
                 } else {
                     run();
                 }
             }
         }
     })(document);