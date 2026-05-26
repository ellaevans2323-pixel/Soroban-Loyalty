import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CampaignCard } from "../components/CampaignCard";
import { Campaign } from "../lib/api";

const baseCampaign: Campaign = {
  id: 1,
  merchant: "GABC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234",
  reward_amount: 100,
  expiration: Math.floor(Date.now() / 1000) + 86400,
  active: true,
  total_claimed: 0,
};

const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  'javascript:alert(1)',
  '<iframe src="javascript:alert(1)">',
];

describe("CampaignCard XSS prevention", () => {
  XSS_PAYLOADS.forEach((payload) => {
    it(`does not execute or render raw HTML for payload: ${payload.slice(0, 40)}`, () => {
      const campaign = { ...baseCampaign, merchant: payload };
      const { container } = render(<CampaignCard campaign={campaign} />);

      // No script tags should be injected into the DOM
      expect(container.querySelector("script")).toBeNull();
      // No iframe tags
      expect(container.querySelector("iframe")).toBeNull();
      // No img with onerror
      const imgs = container.querySelectorAll("img");
      imgs.forEach((img) => expect(img.getAttribute("onerror")).toBeNull());
      // No svg with onload
      const svgs = container.querySelectorAll("svg");
      svgs.forEach((svg) => expect(svg.getAttribute("onload")).toBeNull());
    });
  });

  it("renders merchant address as text content, not HTML", () => {
    const payload = '<script>alert("xss")</script>';
    const campaign = { ...baseCampaign, merchant: payload };
    const { container } = render(<CampaignCard campaign={campaign} />);
    // Component slices merchant string — no script tag should be injected
    expect(container.querySelector("script")).toBeNull();
    // The merchant span should contain only text nodes, no child elements
    const mono = container.querySelector(".mono");
    expect(mono).not.toBeNull();
    expect(mono!.querySelector("script")).toBeNull();
  });

  it("renders campaign id as plain text", () => {
    render(<CampaignCard campaign={baseCampaign} />);
    expect(screen.getByText(/Campaign #1/)).toBeInTheDocument();
  });
});
