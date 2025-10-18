import React from 'react';
import { render } from '@testing-library/react';
import CvFootnote from './CvFootnote';

describe('CvFootnote', () => {
  it('renders inline code segments as <code> elements', () => {
    const text = 'Pro tip: export as <code>resume.pdf</code> before applying.';
    const { container } = render(<CvFootnote text={text} data-testid="cv-footnote" />);

    const wrapper = container.querySelector('[data-testid="cv-footnote"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.textContent).toBe('Pro tip: export as resume.pdf before applying.');

    const codeElement = wrapper?.querySelector('code');
    expect(codeElement).not.toBeNull();
    expect(codeElement?.textContent).toBe('resume.pdf');
  });

  it('renders potentially unsafe markup as plain text', () => {
    const malicious = "Never paste <script>alert('xss')</script> into forms.";
    const { container } = render(<CvFootnote text={malicious} data-testid="cv-footnote" />);

    const wrapper = container.querySelector('[data-testid="cv-footnote"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.querySelector('script')).toBeNull();
    expect(wrapper?.textContent).toBe("Never paste <script>alert('xss')</script> into forms.");
  });
});
