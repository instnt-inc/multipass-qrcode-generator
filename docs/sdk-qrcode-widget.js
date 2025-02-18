(function() {
  // 1. Grab data attributes from the <script> tag
  const scriptEl       = document.currentScript;
  const workflowId     = scriptEl.getAttribute('data-workflow-id');
  const idmetricsVer   = scriptEl.getAttribute('data-idmetrics-version') || '4.8.2';
  const invitationType = scriptEl.getAttribute('data-invitation-type')   || 'verifier'; // 'verifier' or 'issuer'
  const action         = scriptEl.getAttribute('data-action')            || 'authenticate'; // 'authenticate' or 'signup'
  const redirectUrl    = scriptEl.getAttribute('data-redirect-url')      || 'https://www.instnt.org/';

  // 2. Config
  const serviceUrl  = 'https://dev-api.instnt.org';
  const sdkVersion  = '2.1.0-beta.2';
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
  function instntEventHandler(event) {
    console.log("Instnt event handler called", event);

    const eventData = event.event_data ? event.event_data : event.data;
    const eventType = event.event_type ? event.event_type : event.type;

    if (eventType === "transaction.accepted") {
      console.log("transaction.accepted => redirecting...");
      // e.g., open redirect URL in a new tab
      window.open(redirectUrl, "_blank");
    } 
    else if (eventType === "transaction.review" || eventType === "transaction.rejected") {
      console.log("transaction.review or transaction.rejected => redirecting...");
      window.open(redirectUrl, "_blank");
    } 
    else {
      console.warn("Unhandled Instnt event:", eventType, eventData);
    }
  }

  // 5. Function to handle the "authenticate" flow
  function performEntireLoginProcess(containerEl) {
    console.log("Running authenticate flow (performEntireLoginProcess)...");

    // (A) POST to /public/initiate_login with the form_key
    const initLoginUrl = `${serviceUrl}/public/initiate_login`;
    fetch(initLoginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_key: workflowId })
    })
    .then(response => response.json())
    .then(res => {
      // Should contain { invitation_url, login_session_id }
      const invitationUrl    = res.invitation_url;
      const loginSessionId   = res.login_session_id;

      if (!invitationUrl || !loginSessionId) {
        throw new Error("initiate_login response missing invitation_url or login_session_id");
      }

      // (B) Generate a QR code for the invitationUrl
      const qrDiv = document.createElement('div');
      containerEl.appendChild(qrDiv);

      const qrCode = new QRCodeStyling({
        data: invitationUrl,
        width: 225,
        height: 225,
        image: 'https://5764175.fs1.hubspotusercontent-na1.net/hub/5764175/hubfs/Add%20a%20heading%20(1).png?width=108&height=108',
        imageOptions: {
          hideBackgroundDots: false,
          imageSize: 1.1
        }
      });
      qrCode.append(qrDiv);

      // (C) Start polling every 3s for authentication.success
      initiatePolling(loginSessionId);
    })
    .catch(err => {
      console.error("Error in performEntireLoginProcess:", err);
    });
  }

  // 6. Polling function to check for authentication.success
  function initiatePolling(loginSessionId) {
    const context = 'login';
    let from      = 0;
    let pollCount = 0;
    const maxPoll = 60;  // 60 tries => 3 minutes at 3s each
    let isPolling = true;

    const pollInterval = setInterval(() => {
      if (!isPolling) {
        clearInterval(pollInterval);
        return;
      }

      pollCount++;
      if (pollCount > maxPoll) {
        console.warn('No user response found, stopping polling after 60 tries.');
        isPolling = false;
        clearInterval(pollInterval);
        return;
      }

      // GET /public/transactions/{login_session_id}/events?context=login&from=NN
      const eventsUrl = `${serviceUrl}/public/transactions/${loginSessionId}/events?context=${context}&from=${from}`;
      fetch(eventsUrl)
        .then(r => r.json())
        .then(res => {
          // If there's at least one event, check the first one
          if (res.events && res.events.length > 0) {
            const firstEvent = res.events[0];
            const eventType  = firstEvent.event_type || firstEvent.type;
            console.log("Polled event:", firstEvent);

            if (eventType === 'authentication.success') {
              console.log('User authenticated => redirecting...');
              // In Angular code, we do more data handling. Here we simply redirect:
              window.open(redirectUrl, "_blank");
              // console.log("Redirecting to:", redirectUrl);
              // window.top.location.href = redirectUrl;
              isPolling = false;
              clearInterval(pollInterval);
              return;
            } else {
              console.warn("Unhandled event:", eventType, firstEvent.event_data || firstEvent.data);
            }
          }
          // Update 'from' for next poll
          from = res.to || from;
        })
        .catch(err => {
          console.error("Error while polling events:", err);
        });
    }, 3000); // poll every 3s
  }

  // 7. Main function: fetch transaction snippet, inject HTML, then either
  //    handle 'signup' or 'authenticate' flow
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
        // A) Inject the Instnt snippet
        const htmlSnippet = res.html;
        const fragment    = document.createRange().createContextualFragment(htmlSnippet);
        const containerEl = document.getElementById(containerId);
        containerEl.appendChild(fragment);

        // B) If Instnt is available, set up event handler
        if (window.instnt) {
          console.log("Instnt is available", window.instnt);
          // Wire up Instnt event handlers
          window.onInstntEvent   = instntEventHandler;
          window.instntSettings  = { onEvent: instntEventHandler };
          window.instnt.onEvent  = instntEventHandler;

          // C) Based on 'invitationType' + 'action' => implement logic
          if (invitationType === 'issuer') {
            console.error("Invitation type 'issuer' is not yet supported in this script.");
            return;
          }

          if (action === 'authenticate') {
            // The new login flow
            performEntireLoginProcess(containerEl);
          }
          else if (action === 'signup') {
            // The existing signup flow: getInvitationURLForSignup
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
          else {
            console.error(`Action '${action}' is not recognized. Use 'signup' or 'authenticate'.`);
          }
        }
      })
      .catch(err => console.error('Error:', err));
  }

  // 8. Load jQuery first, then qr-code-styling, then run generateQrCode()
  loadScript('https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js')
    .then(() => loadScript('https://unpkg.com/qr-code-styling@1.5.0/lib/qr-code-styling.js'))
    .then(() => {
      generateQrCode();
    })
    .catch(err => {
      console.error('Failed to load scripts:', err);
    });

})();
