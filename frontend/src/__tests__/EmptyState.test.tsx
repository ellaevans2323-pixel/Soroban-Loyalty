import { render, screen, fireEvent } from "./test-utils";
import { EmptyState } from "@/components/EmptyState";
import { RewardList } from "@/components/RewardList";
import { Reward } from "@/lib/api";

// ── EmptyState component ──────────────────────────────────────────────────────

describe("EmptyState component", () => {
  test("renders title and description", () => {
    render(
      <EmptyState
        illustration="campaigns"
        title="No campaigns yet"
        description="Create your first campaign to get started."
      />
    );
    expect(screen.getByText("No campaigns yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first campaign to get started.")).toBeInTheDocument();
  });

  test("renders CTA link when href provided", () => {
    render(
      <EmptyState
        illustration="campaigns"
        title="No campaigns"
        description="desc"
        cta={{ label: "Create campaign", href: "/merchant" }}
      />
    );
    const link = screen.getByRole("link", { name: "Create campaign" });
    expect(link).toHaveAttribute("href", "/merchant");
  });

  test("renders CTA button and calls onClick", () => {
    const onClick = jest.fn();
    render(
      <EmptyState
        illustration="rewards"
        title="No rewards"
        description="desc"
        cta={{ label: "Claim reward", onClick }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Claim reward" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("renders rewards illustration", () => {
    render(
      <EmptyState illustration="rewards" title="No rewards" description="desc" />
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("renders transactions illustration", () => {
    render(
      <EmptyState illustration="transactions" title="No transactions" description="desc" />
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("has accessible label matching title", () => {
    render(
      <EmptyState illustration="campaigns" title="Empty campaigns" description="desc" />
    );
    expect(screen.getByRole("status", { name: "Empty campaigns" })).toBeInTheDocument();
  });
});

// ── RewardList empty state ────────────────────────────────────────────────────

describe("RewardList empty state", () => {
  test("renders EmptyState when rewards array is empty", () => {
    render(<RewardList rewards={[]} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/no rewards yet/i)).toBeInTheDocument();
  });

  test("empty state has CTA linking to dashboard", () => {
    render(<RewardList rewards={[]} />);
    expect(screen.getByRole("link", { name: /claim your first reward/i })).toHaveAttribute(
      "href",
      "/dashboard"
    );
  });

  test("does not render EmptyState when rewards exist", () => {
    const reward: Reward = {
      id: "r1",
      user_address: "GABC",
      campaign_id: 1,
      amount: 100,
      redeemed: false,
      redeemed_amount: 0,
      claimed_at: new Date().toISOString(),
    };
    render(<RewardList rewards={[reward]} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText(/Campaign #1/)).toBeInTheDocument();
  });
});

// ── Analytics empty state (unit-level) ───────────────────────────────────────
// The analytics page is a Next.js client component that fetches data; we test
// the EmptyState renders the correct message/CTA for the analytics context.

describe("Analytics empty state messages", () => {
  test("campaigns empty state has correct CTA", () => {
    render(
      <EmptyState
        illustration="campaigns"
        title="No campaign data"
        description="No claim data for this period."
        cta={{ label: "Create a campaign", href: "/merchant" }}
      />
    );
    expect(screen.getByText("No campaign data")).toBeInTheDocument();
    expect(screen.getByText("No claim data for this period.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create a campaign" })).toHaveAttribute(
      "href",
      "/merchant"
    );
  });

  test("time-series empty state renders correctly", () => {
    render(
      <EmptyState
        illustration="transactions"
        title="No time-series data"
        description="No time-series data for this period."
      />
    );
    expect(screen.getByText("No time-series data")).toBeInTheDocument();
    expect(screen.getByText("No time-series data for this period.")).toBeInTheDocument();
  });
});
