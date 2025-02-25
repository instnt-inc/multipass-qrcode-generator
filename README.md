# Instnt Multipass QR Code Generator

This repository provides a simple **copy-and-paste** code snippet that you can embed on your website to display a QR code for Instnt’s Multipass flow. Once the QR code is scanned and the user completes the flow, they will be redirected to a specified URL.

## Getting Started

1. **Copy & Paste** the following HTML snippet anywhere in your webpage where you want the QR code to appear:

```html
<div id="instnt-QR-widget"></div>
<script 
  src="https://instnt-inc.github.io/multipass-qrcode-generator/sdk-qrcode-widget.js"
  data-workflow-id="v##############"  
  data-invitation-type="verifier" 
  data-action="authenticate"
  data-redirect-url="Your_Website_URL">
</script>
```

## How It Works

- **`<div id="instnt-QR-widget"></div>`**  
  This is the container where the Instnt snippet and the generated QR code are injected.

- **`<script src="...sdk-qrcode-widget.js" ...>`**  
  - **Loads** the JavaScript file hosted on GitHub Pages.  
  - **Reads** the data attributes you provide and uses them to configure Instnt’s Multipass flow:  
    - **`data-workflow-id`**: The **ID** of the Workflow you created in the Instnt dashboard (e.g., `v##############`).  
    - **`data-invitation-type`**: Either **`verifier`** or **`issuer`**, depending if you are verifying the user or providing the credentials.  
    - **`data-action`**: Either **`authenticate`** or **`signup`**, indicating which flow to initiate.  
    - **`data-redirect-url`**: The URL the user will be sent to once the authentication or signup is complete.  
  - **Fetches** the transaction snippet from Instnt’s backend.  
  - **Generates** a QR code using the fetched data.  
  - **Monitors** for events (like `authentication.success`) and redirects to your specified `data-redirect-url` when triggered.

### Why an External Script?

By hosting `sdk-qrcode-widget.js` on GitHub Pages, you automatically receive updates and fixes without having to change your own site code. Simply add or update the snippet, and you’re set.

---

## Customization

- **Size of the QR Code**  
  Inside the `sdk-qrcode-widget.js`, the QR code width and height are set to `225`. If you need a different size, you can modify the widget code or fork this repository and customize your own copy.

- **Logo on QR Code**  
  We currently embed a default logo. To customize it, fork the repository and replace the `image` field within the JavaScript with the URL of your choice.

---

## Troubleshooting

1. **QR Code Not Showing**  
   - Ensure you have copied the **entire** HTML snippet (both the `<div>` and the `<script>`).
   - Confirm that your `data-workflow-id` is correct.

2. **Redirection Happens in a Small Iframe (e.g., Wix)**  
   - Some site builders embed custom code in an iframe. If you need a **full-page redirect**, try opening a new tab (`_blank`) or adjusting your site’s embed settings to allow top-level navigation.

3. **Errors in Console**  
   - Check your browser’s JavaScript console for any errors or warnings related to script loading or cross-domain issues.

---

## Contributing

Feel free to **fork** this repository and modify the `sdk-qrcode-widget.js` if you need additional customizations, such as:

- Different QR code styling.
- Expanded event handling logic.
- Alternate JavaScript libraries.

Then host your version on your own GitHub Pages or static hosting provider.

---

## License

This project is provided under the [MIT License](LICENSE). Use it as a template or reference to build your own Instnt Multipass QR integrations.
