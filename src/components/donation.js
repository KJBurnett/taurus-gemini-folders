/**
 * Donation Modal Component
 * Handles the display and logic for the 'Buy me a coffee' feature.
 */

export class DonationModal {
    constructor() {
        this.overlay = null;
    }

    show() {
        if (this.overlay) return; // Prevent duplicates

        this.overlay = document.createElement('div');
        this.overlay.className = 'gemini-folders-modal-overlay'; // Re-use main modal overlay class for consistency

        // Asset URLs
        const venmoQr = chrome.runtime.getURL('assets/venmo-kyler-burnett.jpg');
        const paypalQr = chrome.runtime.getURL('assets/paypal-kyler-burnett.jpg');

        this.overlay.innerHTML = `
            <div class="gemini-folders-modal donation-modal">
                <h3 class="gemini-modal-title" style="text-align:center">Support Development ☕</h3>
                <p class="gemini-modal-message" style="text-align:center; margin-bottom: 20px;">
                    Any amount of donation helps me continue making cool tools & products like this, help me convert caffeine into code! &lt;3
                </p>
                
                <div class="donation-options">
                    <div class="donation-option">
                        <h4>Venmo</h4>
                        <div class="qr-container">
                            <img src="${venmoQr}" alt="Venmo QR Code">
                        </div>
                        <a href="https://venmo.com/u/Kyler-Burnett" target="_blank" class="donation-link">@Kyler-Burnett</a>
                    </div>
                    <div class="donation-option">
                        <h4>PayPal</h4>
                        <div class="qr-container">
                            <img src="${paypalQr}" alt="PayPal QR Code">
                        </div>
                        <a href="https://paypal.me/KylerBurnett" target="_blank" class="donation-link">paypal.me/KylerBurnett</a>
                    </div>
                </div>

                <div class="gemini-modal-actions" style="justify-content: center; margin-top: 20px;">
                    <button class="gemini-modal-btn confirm">Close</button>
                </div>

                <div class="donation-footer">
                    <p>This extension is provided "as-is" without any warranty.</p>
                    <a href="https://github.com/KJBurnett/taurus-gemini-folders" target="_blank">View on GitHub</a>
                </div>
            </div>
        `;

        const closeBtn = this.overlay.querySelector('.confirm');
        const close = () => {
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
        };

        closeBtn.addEventListener('click', close);
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) close();
        });

        document.body.appendChild(this.overlay);
    }
}
