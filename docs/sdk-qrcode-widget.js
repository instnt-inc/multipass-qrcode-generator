(function() {
  // data attributes from the <script> tag
  const scriptEl       = document.currentScript;
  const onEventAttr    = scriptEl.getAttribute('data-on-event');
  const workflowId     = scriptEl.getAttribute('data-workflow-id');
  const idmetricsVer   = scriptEl.getAttribute('data-idmetrics-version') || '4.8.2';
  const invitationType = scriptEl.getAttribute('data-invitation-type')   || 'verifier';
  const action         = scriptEl.getAttribute('data-action')            || 'authenticate';

  // Configuration for Instnt flow
  const serviceUrl  = 'https://dev-api.instnt.org';
  const sdkVersion  = '2.1.0-beta.2';
  const containerId = 'instnt-QR-widget'; // The <div> where we'll inject HTML & QR code

  // Utility to load external scripts and return a Promise
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Main function: fetch transaction, inject snippet, generate QR
  function generateQrCode() {
    const endpointUrl = `${serviceUrl}/public/transactions?idmetrics_version=${idmetricsVer}&sdk=angular&sdk_version=${sdkVersion}`;
    const payload     = { form_key: workflowId };

    fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(response => response.json())
      .then(res => {
        // Inject the HTML snippet
        const htmlSnippet = res.html;
        const fragment    = document.createRange().createContextualFragment(htmlSnippet);
        const containerEl = document.getElementById(containerId);
        containerEl.appendChild(fragment);

        // If instnt is available, wire up the user’s event callback and get the invitation URL
        if (window.instnt) {
          // If user provided a global callback name, wire it up
          if (onEventAttr && typeof window[onEventAttr] === 'function') {
            window.onInstntEvent = window[onEventAttr];
            window.instntSettings = {
              onEvent: window[onEventAttr]
            };
          }

          // Get the invitation URL and generate the QR code
          window.instnt.getInvitationURLForSignup(window.instnt.instnttxnid).then(invitation_url => {
            const qrDiv = document.createElement('div');
            containerEl.appendChild(qrDiv);

            //  Create the QR code with the invitation_url
            const qrCode = new QRCodeStyling({
              data: invitation_url,
              width: 200,
              height: 200,
              image: 'https://5764175.fs1.hubspotusercontent-na1.net/hub/5764175/hubfs/Add%20a%20heading%20(1).png?width=108&height=108',
              imageOptions: {
                hideBackgroundDots: false,
                imageSize: 1.2
              }
            });
            qrCode.append(qrDiv);
          });
        }
      })
      .catch(err => console.error('Error:', err));
  }

  // Load jQuery, then qr-code-styling, then run generateQrCode()
  loadScript('https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js')
    .then(() => loadScript('https://unpkg.com/qr-code-styling@1.5.0/lib/qr-code-styling.js'))
    .then(() => {
      generateQrCode();
    })
    .catch(err => {
      console.error('Failed to load scripts:', err);
    });

})();