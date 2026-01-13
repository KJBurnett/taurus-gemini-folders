
/**
 * @jest-environment jsdom
 */

import { DonationModal } from './donation.js';
import fs from 'fs';
import path from 'path';

// Load setup
import '../../tests/setup.js';

describe('DonationModal', () => {
    let modal;

    beforeEach(() => {
        // Clean up body before each test
        document.body.innerHTML = '';
        modal = new DonationModal();
    });

    test('should instantiate correctly', () => {
        expect(modal).toBeTruthy();
        expect(modal.overlay).toBeNull();
    });

    test('should render overlay and content on show()', () => {
        modal.show();

        const overlay = document.querySelector('.gemini-folders-modal-overlay');
        expect(overlay).toBeTruthy();

        // Check for key elements
        expect(overlay.querySelector('.gemini-modal-title').textContent).toContain('Support Development');
        expect(overlay.querySelector('.donation-options')).toBeTruthy();

        // Check for specific Venmo/PayPal links
        const links = Array.from(overlay.querySelectorAll('a.donation-link'));
        expect(links.some(l => l.href.includes('venmo.com'))).toBe(true);
        expect(links.some(l => l.href.includes('paypal.me'))).toBe(true);

        // Check for Footer (Disclaimer & GitHub)
        const footer = overlay.querySelector('.donation-footer');
        expect(footer).toBeTruthy();
        expect(footer.textContent).toContain('as-is');
        expect(footer.querySelector('a[href*="github.com/KJBurnett/taurus-gemini-folders"]')).toBeTruthy();
    });

    test('should not render duplicate overlays if show() called twice', () => {
        modal.show();
        modal.show();

        const overlays = document.querySelectorAll('.gemini-folders-modal-overlay');
        expect(overlays.length).toBe(1);
    });

    test('should close when Close button is clicked', () => {
        modal.show();
        const closeBtn = document.querySelector('.gemini-modal-btn.confirm');

        closeBtn.click();

        const overlay = document.querySelector('.gemini-folders-modal-overlay');
        expect(overlay).toBeNull();
    });

    test('should close when clicking background overlay', () => {
        modal.show();
        const overlay = document.querySelector('.gemini-folders-modal-overlay');

        overlay.click();

        const remaining = document.querySelector('.gemini-folders-modal-overlay');
        expect(remaining).toBeNull();
    });

    test('referenced assets should exist on disk', () => {
        modal.show();
        const images = Array.from(document.querySelectorAll('img'));

        expect(images.length).toBeGreaterThan(0);

        images.forEach(img => {
            // chrome.runtime.getURL mock returns just the path (e.g., 'assets/venmo.jpg')
            // We need to resolve this relative to the project root
            // content.js/components usually run in browser context, so paths are relative to extension root.
            // Our mock returns 'assets/foo.jpg'.

            const relativePath = img.getAttribute('src');
            const absolutePath = path.resolve(process.cwd(), relativePath);

            expect(fs.existsSync(absolutePath)).toBe(true);
        });
    });
});
