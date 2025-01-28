(function() {
    // data attributes from this <script> tag
    const scriptEl = document.currentScript;
  
    const workflowId      = scriptEl.getAttribute('data-workflow-id');
    const idmetricsVer    = scriptEl.getAttribute('data-idmetrics-version') || '4.8.2';
    const invitationType  = scriptEl.getAttribute('data-invitation-type') || 'verifier';
    const action          = scriptEl.getAttribute('data-action') || 'authenticate';
  
    // config
    const serviceUrl  = 'https://dev-api.instnt.org';
    const sdkVersion  = '2.1.0-beta.2';
    // Container in which to inject the form snippet
    const containerId = 'instnt-QR-widget';
  
    function loadScript(src) {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
  
    // Main function that fetches transaction, injects snippet, and generates QR
    function generateQrCode() {
      const endpointUrl = `${serviceUrl}/public/transactions?idmetrics_version=${idmetricsVer}&sdk=angular&sdk_version=${sdkVersion}`;
      const payload = { form_key: workflowId };
  
      fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(response => response.json())
        .then(res => {
          // Inject the HTML snippet
          const htmlSnippet = res.html;
          const fragment = document.createRange().createContextualFragment(htmlSnippet);
          const containerEl = document.getElementById(containerId);
          containerEl.appendChild(fragment);
  
          if (window.instnt) {
            // getInvitationURLForSignup
            window.instnt.getInvitationURLForSignup(window.instnt.instnttxnid).then(invitation_url => {
              
              const qrDiv = document.createElement('div');
              containerEl.appendChild(qrDiv);
  
              const qrCode = new QRCodeStyling({
                data: invitation_url,
                width: 200,
                height: 200,
                image: 'https://5764175.fs1.hubspotusercontent-na1.net/hub/5764175/hubfs/Add%20a%20heading%20(1).png?width=108&height=108',
                imageOptions: { hideBackgroundDots: false, imageSize: 1.2 }
              });
              qrCode.append(qrDiv);
            });
          }
        })
        .catch(err => console.error('Error:', err));
    }
  
    // Ensure the QR code library is loaded, then run the generation
    loadScript('https://unpkg.com/qr-code-styling@1.5.0/lib/qr-code-styling.js')
      .then(() => {
        generateQrCode();
      })
      .catch(e => {
        console.error('Failed to load qr-code-styling library:', e);
      });
  })();