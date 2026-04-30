(function () {
  var dark = document.documentElement.dataset.theme === 'dark';

  // Inject kapa widget script with initial theme colours.
  // data-theme is set by ThemeProvider's is:inline script before this deferred script runs.
  var s = document.createElement('script');
  s.src = 'https://widget.kapa.ai/kapa-widget.bundle.js';
  s.async = true;
  Object.assign(s.dataset, {
    websiteId: '73cafe70-9be1-494b-bd31-b849fc29799f',
    projectName: 'Internet Computer',
    projectColor: '#cc5a2b',
    projectLogo: 'https://docs.internetcomputer.org/favicon.svg',
    modalOverrideOpenClass: 'ask-ai-widget-trigger',
    modalAskAiInputPlaceholder: 'Ask anything about building on ICP...',
    modalExampleQuestions: 'What makes ICP different from traditional clouds?,How can I build and deploy ICP apps with coding agents?,How does my app store data?,How do I pay for my application?,How do I add user login to my app?,Is my app\'s data private on ICP?',
    modalDisclaimer: 'AI responses are generated automatically and may be inaccurate. Verify critical information before acting on it.',
    buttonHide: 'true',
    botProtectionMechanism: 'hcaptcha',
    userAnalyticsFingerprintEnabled: 'true',
    modalZIndex: '1001',
  });
  if (dark) {
    Object.assign(s.dataset, {
      modalBgColor: '#1b1812',
      fontColor: '#f0ebe0',
      modalBorderColor: '#2d2820',
    });
  }
  document.head.appendChild(s);

  // ICP brand tokens injected into kapa's Mantine shadow DOM.
  // Kapa hardcodes data-mantine-color-scheme="light" on #kapa-widget-root regardless of
  // the data-modal-bg-color attribute, so we flip the attribute and override Mantine's CSS
  // variables directly inside the open shadow root.
  var TOKENS = {
    light: '#kapa-widget-root{--mantine-color-body:#fdfaf3;--mantine-color-default:#f8f5ef;--mantine-color-default-border:#e5ddcf;--mantine-color-text:#1a1714;--mantine-color-placeholder:#6b6660;}',
    dark:  '#kapa-widget-root{--mantine-color-body:#1b1812;--mantine-color-default:#221e18;--mantine-color-default-border:#2d2820;--mantine-color-text:#f0ebe0;--mantine-color-placeholder:#a29a8d;}',
  };

  function sync() {
    var c = document.getElementById('kapa-widget-container');
    if (!c || !c.shadowRoot) return false;
    var r = c.shadowRoot.querySelector('#kapa-widget-root');
    if (!r) return false;
    var scheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    r.setAttribute('data-mantine-color-scheme', scheme);
    var st = c.shadowRoot.querySelector('#kapa-icp-tokens');
    if (!st) {
      st = document.createElement('style');
      st.id = 'kapa-icp-tokens';
      c.shadowRoot.appendChild(st);
    }
    st.textContent = TOKENS[scheme];
    return true;
  }

  // Watch for kapa-widget-container being added to the DOM (kapa loads async).
  var bodyObserver = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;
      for (var j = 0; j < added.length; j++) {
        if (added[j].id === 'kapa-widget-container') {
          // Give kapa's React one tick to finish rendering the shadow root.
          setTimeout(function () { if (sync()) bodyObserver.disconnect(); }, 0);
          return;
        }
      }
    }
  });
  bodyObserver.observe(document.body, { childList: true });
  sync(); // In case kapa was already in the DOM (e.g. client-side navigation).

  // Re-sync whenever the user toggles the site theme.
  new MutationObserver(sync).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  // react-remove-scroll stamps data-scroll-locked on body and injects a <style> tag with
  // `body[data-scroll-locked] { margin-right: 17px !important }` to compensate for the
  // scrollbar disappearing. With scrollbar-gutter: stable the space is already reserved,
  // so this margin shifts content instead of preventing a shift.
  // Primary fix: @layer kapa-fix in custom.css (layered !important beats unlayered).
  // Backup: patch the injected node's text content directly so the rule is never applied.
  new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      for (var j = 0; j < mutations[i].addedNodes.length; j++) {
        var n = mutations[i].addedNodes[j];
        if (n.nodeName === 'STYLE' && n.textContent &&
            n.textContent.indexOf('data-scroll-locked') !== -1) {
          n.textContent = n.textContent.replace(
            /margin-right\s*:\s*[^;!}]*(?:\s*!important)?/g,
            'margin-right:0'
          );
        }
      }
    }
  }).observe(document.head, { childList: true });

})();
