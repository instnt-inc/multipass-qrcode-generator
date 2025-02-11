(function () {
  // 1. Grab data attributes from the <script> tag
  const scriptEl = document.currentScript;
  const workflowId = scriptEl.getAttribute('data-workflow-id');
  const idmetricsVer = scriptEl.getAttribute('data-idmetrics-version') || '4.8.2';
  const invitationType = scriptEl.getAttribute('data-invitation-type') || 'verifier'; //'verifier' or 'issuer'
  const action = scriptEl.getAttribute('data-action') || 'authenticate'; // 'authenticate' or 'signup'
  const redirectUrl = scriptEl.getAttribute('data-redirect-url') || 'https://www.instnt.org/';

  // 2. Config
  const serviceUrl = 'https://dev-api.instnt.org';
  const sdkVersion = '2.1.0-beta.2';
  const containerId = 'instnt-QR-widget'; // The <div> for snippet & QR

  // 3. Utility to load scripts in sequence
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // 4. Minimal event handler for Instnt
  instntEventHandler = (event) => {
    console.log("Instnt event handler called", event);

    const eventData = event.event_data ? event.event_data : event.data;
    const eventType = event.event_type ? event.event_type : event.type;

    if (eventType === "transaction.accepted") {
      console.log("EventData:", eventData);
      console.log("authentication.success => redirecting...");
      // Redirect the user
      window.top.location.href = redirectUrl;
      window.open(redirectUrl, "_blank");
    } else if(eventType === "transaction.review" || eventType === "transaction.rejected") {
      console.log("authentication.failure => redirecting...");
      // Redirect the user
      window.top.location.href = "https://www.instnt.org/";
      window.open(redirectUrl, "_blank");
    } else {
      console.warn("Unhandled event:", eventType, eventData);
    }
  }

  // 5. Main function: fetch transaction, inject snippet, generate QR
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
        // A) Inject the Instnt snippet
        const htmlSnippet = res.html;
        const fragment = document.createRange().createContextualFragment(htmlSnippet);
        const containerEl = document.getElementById(containerId);
        containerEl.appendChild(fragment);

        // B) If Instnt is available, set up event handler + get the invitation URL
        if (window.instnt) {
          console.log("Instnt is available", instnt);

          // -- 1) Wire up the Instnt event handler
          window.onInstntEvent = instntEventHandler;
          window.instntSettings = { onEvent: instntEventHandler };
          window.instnt.onEvent = instntEventHandler;

          // -- 2) Call the instnt.js function to get the invitation URL for signup, login, or as an issuer
          if (invitationType === 'issuer') {
            console.error("Invitation type 'issuer' is not supported yet.");
            return;
          }
          if (action === 'authenticate') {
            console.error("Action 'authenticate' is not currently working");
            return;
          }
          if (action === 'signup') {
            console.log("Getting invitation URL for signup...");
            window.instnt.getInvitationURLForSignup(window.instnt.instnttxnid).then(invitation_url => {
              const qrDiv = document.createElement('div');
              containerEl.appendChild(qrDiv);

              // Create the QR code
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
        }
      })
      .catch(err => console.error('Error:', err));
  }

  // 6. Load jQuery first, then qr-code-styling, then run generateQrCode()
  loadScript('https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js')
    .then(() => loadScript('https://unpkg.com/qr-code-styling@1.5.0/lib/qr-code-styling.js'))
    .then(() => {
      generateQrCode();
    })
    .catch(err => {
      console.error('Failed to load scripts:', err);
    });

})();

// onInstntEvent({event_type: "authentication.processed", event_data: {"status": "success"}});
// instnt.emit({type: 'transaction.success', data: {"test": "test Success"}, "status": "success"});